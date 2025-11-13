import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

const url = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(url);

redisClient.on('error', (err) => {
  Logger.error(JSON.stringify({ event: 'redis_error', message: err.message }));
});

redisClient.on('connect', () => {
  Logger.log(JSON.stringify({ event: 'redis_connect' }));
});
