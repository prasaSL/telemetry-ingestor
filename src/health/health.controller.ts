import { Controller, Get } from '@nestjs/common';
import { connection } from 'mongoose';
import { redisClient } from '../telemetry/redis.provider';

@Controller('health')
export class HealthController {
  @Get()
  async get() {
    const mongoOk = connection.readyState === 1;
    let redisOk = false;
    try {
      const pong = await redisClient.ping();
      redisOk = pong === 'PONG';
    } catch {}
    return { mongo: mongoOk ? 'up' : 'down', redis: redisOk ? 'up' : 'down' };
  }
}
