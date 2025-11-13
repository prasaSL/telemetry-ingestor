import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Telemetry, TelemetryDocument } from './schemas/telemetry.schema';
import { Model } from 'mongoose';
import axios from 'axios';
import { redisClient } from './redis.provider';
import { TelemetryDto } from './dto/telemetry.dto';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL || '';
  private RATE_LIMIT = Number(process.env.INGEST_RATE_LIMIT_PER_MIN || 60);

  constructor(@InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>) {}

  private async rateLimit(deviceId: string) {
    try {
      const key = `rate:${deviceId}`;
      const val = await redisClient.incr(key);
      if (val === 1) await redisClient.expire(key, 60);
      return val <= this.RATE_LIMIT;
    } catch (e) {
      // On Redis failure, be permissive to avoid blocking ingestion.
      this.logger.warn(JSON.stringify({ event: 'rate_limit_redis_error', message: e.message }));
      return true;
    }
  }

  private async shouldSendAlert(deviceId: string, reason: string) {
    try {
      const key = `alert_sent:${deviceId}:${reason}`;
      // ioredis TypeScript typings may not expose the 'NX','EX' overloads as expected,
      // so use setnx + expire to provide equivalent NX+EX behavior in a type-safe way.
      const setnxResult = await redisClient.setnx(key, '1');
      if (setnxResult === 1) {
        try {
          await redisClient.expire(key, 60);
        } catch (e) {
          this.logger.warn(JSON.stringify({ event: 'redis_expire_failed', message: e.message }));
        }
        return true;
      }
      return false;
    } catch (e) {
      this.logger.warn(JSON.stringify({ event: 'alert_dedup_redis_error', message: e.message }));
      return true; // if redis fails, attempt to send alert (safer)
    }
  }

  private async sendAlert(payload: any) {
    if (!this.ALERT_WEBHOOK) {
      this.logger.warn(JSON.stringify({ event: 'no_alert_webhook_configured' }));
      return;
    }
    try {
      await axios.post(this.ALERT_WEBHOOK, payload, { timeout: 5000 });
      this.logger.log(JSON.stringify({ event: 'alert_sent', deviceId: payload.deviceId, reason: payload.reason }));
    } catch (err: any) {
      this.logger.error(JSON.stringify({ event: 'alert_failed', message: err.message }));
    }
  }

  async ingestSingle(dto: TelemetryDto) {
    if (!(await this.rateLimit(dto.deviceId))) {
      throw new BadRequestException('Rate limit exceeded for device');
    }

    const doc = new this.telemetryModel({
      deviceId: dto.deviceId,
      siteId: dto.siteId,
      ts: new Date(dto.ts),
      metrics: dto.metrics,
    });

    await doc.save();

    const cacheKey = `latest:${dto.deviceId}`;
    try {
      await redisClient.set(cacheKey, JSON.stringify({
        deviceId: dto.deviceId,
        siteId: dto.siteId,
        ts: dto.ts,
        metrics: dto.metrics,
      }), 'EX', 60 * 60 * 24);
    } catch (e) {
      this.logger.warn(JSON.stringify({ event: 'redis_set_failed', message: e.message }));
    }

    if (dto.metrics.temperature > 50) {
      const reason = 'HIGH_TEMPERATURE';
      if (await this.shouldSendAlert(dto.deviceId, reason)) {
        await this.sendAlert({
          deviceId: dto.deviceId,
          siteId: dto.siteId,
          ts: dto.ts,
          reason,
          value: dto.metrics.temperature,
        });
      }
    }
    if (dto.metrics.humidity > 90) {
      const reason = 'HIGH_HUMIDITY';
      if (await this.shouldSendAlert(dto.deviceId, reason)) {
        await this.sendAlert({
          deviceId: dto.deviceId,
          siteId: dto.siteId,
          ts: dto.ts,
          reason,
          value: dto.metrics.humidity,
        });
      }
    }

    return { ok: true };
  }

  async ingestMany(dtos: TelemetryDto[]) {
    // use bulkWrite for performance
    const ops = dtos.map(d => ({
      insertOne: {
        document: {
          deviceId: d.deviceId,
          siteId: d.siteId,
          ts: new Date(d.ts),
          metrics: d.metrics,
        }
      }
    }));
    if (ops.length) await this.telemetryModel.bulkWrite(ops);

    // update cache and alerts per device (simplified)
    for (const d of dtos) {
      const cacheKey = `latest:${d.deviceId}`;
      try {
        await redisClient.set(cacheKey, JSON.stringify({
          deviceId: d.deviceId,
          siteId: d.siteId,
          ts: d.ts,
          metrics: d.metrics,
        }), 'EX', 60 * 60 * 24);
      } catch {}
      // alert checks (no rate-limiting here per doc to keep ingestMany fast)
      if (d.metrics.temperature > 50) {
        const reason = 'HIGH_TEMPERATURE';
        if (await this.shouldSendAlert(d.deviceId, reason)) {
          await this.sendAlert({
            deviceId: d.deviceId, siteId: d.siteId, ts: d.ts, reason, value: d.metrics.temperature,
          });
        }
      }
      if (d.metrics.humidity > 90) {
        const reason = 'HIGH_HUMIDITY';
        if (await this.shouldSendAlert(d.deviceId, reason)) {
          await this.sendAlert({
            deviceId: d.deviceId, siteId: d.siteId, ts: d.ts, reason, value: d.metrics.humidity,
          });
        }
      }
    }

    return { inserted: dtos.length };
  }

  async getLatest(deviceId: string) {
    const cacheKey = `latest:${deviceId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      this.logger.warn(JSON.stringify({ event: 'redis_get_failed', message: e.message }));
    }

    const doc = await this.telemetryModel.findOne({ deviceId }).sort({ ts: -1 }).lean();
    if (doc) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(doc), 'EX', 60 * 60 * 24);
      } catch {}
      return doc;
    }
    return null;
  }

  async getSiteSummary(siteId: string, from?: string, to?: string) {
    const match: any = { siteId };
    if (from || to) {
      match.ts = {};
      if (from) match.ts.$gte = new Date(from);
      if (to)   match.ts.$lte = new Date(to);
    }

    const res = await this.telemetryModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgTemperature: { $avg: '$metrics.temperature' },
          maxTemperature: { $max: '$metrics.temperature' },
          avgHumidity: { $avg: '$metrics.humidity' },
          maxHumidity: { $max: '$metrics.humidity' },
          uniqueDevices: { $addToSet: '$deviceId' }
        }
      },
      {
        $project: {
          _id: 0,
          count: 1,
          avgTemperature: 1,
          maxTemperature: 1,
          avgHumidity: 1,
          maxHumidity: 1,
          uniqueDevices: { $size: '$uniqueDevices' }
        }
      }
    ]);

    return res[0] || { count: 0, avgTemperature: null, maxTemperature: null, avgHumidity: null, maxHumidity: null, uniqueDevices: 0 };
  }
}
