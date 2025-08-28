export interface BaseConfig {
    db: Postgres;
    redis: Redis;
    mode: string;
    port: number;
    hostname: string;
    apiRoot: string;
    printStackTrace: boolean;
    nodeEnv: string;
    shortlinkAliasLength: number;
    appBaseUrl: string;
    consumerName?: string;
    shortlinkRedisThreshold: number;
    shortlinkRedisExpire: number;
}
export interface Postgres {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    url: string;
    poolMin:number,
    poolMax:number,
    poolIdle: number
}
export interface Redis {
    url:string;
    streams?: {
        consumerGroup?: string;
        consumerName?: string;
        blockTime?: number;
        maxRetries?: number;
        readCount?: number;
    }
}

