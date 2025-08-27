import { IsDateString, IsObject, IsOptional, IsString } from "class-validator";

export class EventRecordObject {
    @IsString()
    id?: string;

    @IsString()
    alias: string;

    @IsDateString()
    timestamp: string;

    @IsString()
    eventType: string;

    @IsObject()
    eventData: Record<string, any>;

    @IsDateString()
    @IsOptional()
    createdAt?: Date;

    @IsDateString()
    @IsOptional()
    updatedAt?: Date;
}