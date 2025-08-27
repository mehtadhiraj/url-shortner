import { IsDateString, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUrl } from "class-validator";

export class Response<T> {
    message: string;
    data: T;
}

export class CreateShortLinkRequest {
    @IsUrl({
        protocols: ['http', 'https'],
    }, {
        message: 'Invalid URL',
    })
    url: string;

    @IsString()
    @IsNotEmpty({
        message: 'Campaign ID is required',
    })
    campaignId: string;

    @IsString()
    @IsOptional()
    vanity?: string;
}

export class CreateShortLinkResponse {
    @IsString()
    alias: string;

    @IsString()
    shortUrl: string;

    @IsString()
    campaignId: string;
}

export class ShortlinkObject {
    @IsString()
    @IsOptional()
    id?: string;

    @IsUrl({
        protocols: ['http', 'https'],
    })
    url: string;

    @IsString()
    campaignId: string;

    @IsString()
    alias: string;

    @IsDateString()
    @IsOptional()
    createdAt?: Date;

    @IsDateString()
    @IsOptional()
    updatedAt?: Date;
}

export class ResolveAliasResponse {
    @IsString()
    url: string;

    @IsString()
    alias: string;
}

export class StatsResponse {
    @IsString()
    alias: string;

    @IsNumber()
    totalClicks: number;

    @IsObject()
    daily: Record<string, number>;

    @IsObject()
    hourly: Record<string, number>;
}