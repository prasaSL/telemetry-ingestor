import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelemetryModule } from './telemetry/telemetry.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'], 
    }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        if (!uri) throw new Error('MONGO_URI is missing');
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
        };
      },
      inject: [ConfigService],
    }),
    TelemetryModule,
    HealthModule,
  ],
})
export class AppModule {}
