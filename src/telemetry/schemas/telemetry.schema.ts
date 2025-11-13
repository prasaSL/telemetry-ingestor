import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelemetryDocument = Telemetry & Document;

@Schema({ timestamps: false })
export class Telemetry {
  @Prop({ required: true }) deviceId: string;
  @Prop({ required: true }) siteId: string;
  @Prop({ required: true }) ts: Date;
  @Prop({ required: true, type: Object }) metrics: { temperature: number; humidity: number };
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);
TelemetrySchema.index({ deviceId: 1, ts: -1 });
TelemetrySchema.index({ siteId: 1, ts: 1 });
