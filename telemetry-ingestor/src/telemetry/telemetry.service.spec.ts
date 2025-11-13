import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import { getModelToken } from '@nestjs/mongoose';

// Prevent real Redis connections in tests
jest.mock('./redis.provider', () => ({
  redisClient: { on: jest.fn(), publish: jest.fn(), quit: jest.fn() },
}));

describe('TelemetryService', () => {
  let service: TelemetryService;

  const modelMock = {
    create: jest.fn(),
    insertMany: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        // IMPORTANT: replace 'Telemetry' if your service injects a different model token
        { provide: getModelToken('Telemetry'), useValue: modelMock },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});