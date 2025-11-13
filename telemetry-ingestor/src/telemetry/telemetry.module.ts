import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }])],
  providers: [TelemetryService],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
