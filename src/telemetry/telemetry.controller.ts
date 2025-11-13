import { Body, Controller, Get, Param, Post, Query, Req, BadRequestException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TelemetryDto } from './dto/telemetry.dto';
import type { Request } from 'express';

@Controller('api/v1')
export class TelemetryController {
  constructor(private svc: TelemetryService) {}

  private checkAuth(req: Request) {
    const header = req.headers['authorization']?.toString();
    if (process.env.INGEST_TOKEN) {
      if (!header || !header.startsWith('Bearer ')) throw new BadRequestException('Missing or invalid authorization');
      const token = header.slice('Bearer '.length);
      if (token !== process.env.INGEST_TOKEN) throw new BadRequestException('Invalid ingest token');
    }
  }

    @Post('telemetry')
  async ingest(@Body() body: any, @Req() req: Request) {
    this.checkAuth(req);

    // Accept single object or array
    if (Array.isArray(body)) {
      const validDtos: TelemetryDto[] = []; // fix: avoid never[]
      for (const item of body) {
        const inst = plainToInstance(TelemetryDto, item);
        const errors = await validate(inst as any);
        if (errors.length) throw new BadRequestException('Invalid telemetry item in array');
        validDtos.push(inst); // no cast needed
      }
      return this.svc.ingestMany(validDtos);
    } else {
      const inst = plainToInstance(TelemetryDto, body);
      const errors = await validate(inst as any);
      if (errors.length) throw new BadRequestException('Invalid telemetry payload');
      return this.svc.ingestSingle(inst);
    }
  }

  @Get('devices/:deviceId/latest')
  async getLatest(@Param('deviceId') deviceId: string) {
    return this.svc.getLatest(deviceId);
  }

  @Get('sites/:siteId/summary')
  async getSiteSummary(@Param('siteId') siteId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getSiteSummary(siteId, from, to);
  }
}
