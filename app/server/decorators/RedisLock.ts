import { isNaN } from 'lodash';
import RedisProvider from '../../data/RedisProvider';
import { RedisPrefix } from '../constants/enums';

import { CustomError, KeyInfo, RedisLockConfig, RedisLockDeleteConfig } from '../../types';
import { Logger } from '../../../libs/logs/logger';
import { TOO_MANY_REQUESTS_ERROR } from '../constants/ErrorCode';

function getKeyValue(obj: any, path: string) {
    if (typeof obj === 'string') {
        return obj;
    }
    const keys = path.split('.');
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        obj = obj[key];
    }
    return obj;
}

function processForKey(args: any[], pathInfos: KeyInfo[]): string {
    if (!args || args.length < 1 || !pathInfos || pathInfos.length < 1) return null;
    let finalKey = '';
    for (let i = 0; i < pathInfos.length; i++) {
        const pathInfo = pathInfos[i];
        const obj = args[pathInfo.argIndex];
        const { path } = pathInfo;
        finalKey += `${pathInfo.prefix ? `${pathInfo.prefix}_` : ''}${getKeyValue(obj, path)}`;
        if (i < pathInfos.length - 1) finalKey += '_';
    }
    return finalKey;
}

/**
 * @param lockKey - prefix for the key to be added in redis
 * @param {RedisLockConfig} config - below are the details around redis config.
 * @field {KeyInfo} appendKeyInfos - Object conatining the details required for redis-key-name.
 *          path = path to key inside the object in args.
 *          argIndex = index of argument in args object,
 *          prefix = prefix for key in each lockKey eg: "MYREDISKEY", "LOCK"
 * @field threshold - number of request allowed in a given time duration , default threshold is 1
 * @field expire - time duration for which request need to be limited in seconds, default duration is 1 s
 * @field {RedisLockDeleteConfig} deleteConfig -
 *          OnCompletion - if business logic excution is completed delete the key to allow other request or keep the entry in redis default is false
 *          onError - in case of error, delete or key keep key is configured using this.
*/
export default function RedisLock(lockKey: RedisPrefix, config: RedisLockConfig) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            let lock = null;
            const appendKeyInfos: KeyInfo[] = config?.appendKeyInfos;
            const threshold: number = config?.threshold || 1; // default to 1 request
            const expire: number = config?.expire || 1; // default to 1 second
            // default false for both onCompletion and onError
            const deleteConfig: RedisLockDeleteConfig = {
                onCompletion: config?.deleteConfig?.onCompletion || false,
                onError: config?.deleteConfig?.onError || false,
            };
            const keyToAppend = processForKey(args, appendKeyInfos);
            try {
                lock = `${lockKey}${keyToAppend ? `_${keyToAppend}` : ''}`;
                await RedisProvider.acquireLock(lock, threshold, expire);
                const response = await method.apply(this, args);
                if (deleteConfig.onCompletion) await RedisProvider.releaseLock(lock);
                return response;
            } catch (error) {
                Logger.error(`An error occurred while trying to acquire redis lock. and error is ${error}`);
                if (deleteConfig.onError && lock && !(error instanceof CustomError && error.code === TOO_MANY_REQUESTS_ERROR.code)) {
                    await RedisProvider.releaseLock(lock);
                }
                throw error;
            }
        };
    };
}
