import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TelemetryDto } from '../src/telemetry/dto/telemetry.dto';

describe('TelemetryDto validation', () => {
  it('rejects missing fields', async () => {
    const obj = { deviceId: '', siteId: 's1' };
    const inst = plainToInstance(TelemetryDto, obj);
    const errors = await validate(inst as any);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts valid payload', async () => {
    const obj = { deviceId: 'd1', siteId: 's1', ts: '2025-11-13T10:00:00Z', metrics: { temperature: 20, humidity: 30 } };
    const inst = plainToInstance(TelemetryDto, obj);
    const errors = await validate(inst as any);
    expect(errors.length).toBe(0);
  });
});
