import { TSConvict } from 'ts-convict';
import IORedis, { Redis } from 'ioredis';
import { Redis as RedisConnection } from '../config/Redis';
import { Logger } from '../../libs/logs/logger';
import { CustomError } from '../types/error';
import { TOO_MANY_REQUESTS_ERROR } from '../server/constants/ErrorCode';

let redis: Redis;

export async function getRedisInstance(): Promise<Redis> {
    if (!redis) {
        await connect();
    }
    return redis;
}

export async function connect() {
    console.log('Creating redis connection...');
    const dbLoader = new TSConvict<RedisConnection>(RedisConnection);

    const dbConfig: RedisConnection = dbLoader.load();

    if (!dbConfig.url) throw new Error('No Redis url found.');

    

    return new Promise<Redis>((resolve, reject) => {
        redis = new IORedis(dbConfig.url);

        redis.on('connect', () => {
            console.log('Redis connected');
            resolve(redis);
        });
        redis.on('error', (error) => {
            console.log('Redis error:', error);
            reject(new Error('Redis error'));
        });
    });
}



/**
 *
 * @param key - key of the lock
 * @param lockDuration - number of seconds the key should be locked
 */
export async function acquireLock(key: string, velocityThreshold: number, lockDuration: number): Promise<boolean> {
    if (!redis) {
        redis = await connect();
    }
    const existed = await redis.get(key);
    if (!existed) {
        await redis.set(key, velocityThreshold, 'EX', lockDuration);
    } else {
        let threshold = Number(existed);
        --threshold;
        if (threshold <= 0) {
            throw new CustomError(new Error('Too many request.'), TOO_MANY_REQUESTS_ERROR);
        }
        await redis.set(key, threshold, 'KEEPTTL');
    }
    return true;
}

/**
 *
 * @param key - key of the lock
 * @param lockDuration - number of miliseconds the key should be locked
 */
export async function releaseLock(key: string): Promise<boolean> {
    try {
        if (!redis) {
            redis = await connect();
        }
        await redis.del(key);
        return true;
    } catch (error) {
        Logger.error(`An error occurred releasing redis lock on key - ${key}`);
        return false;
    }
}

export default { getRedisInstance, connect, redis, acquireLock, releaseLock };
