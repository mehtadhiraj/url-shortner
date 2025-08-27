export interface KeyInfo {
    path: string; // path to the key in the object in args
    prefix?: string; // prefix for the key in the redis
    argIndex: number; // index of the argument in the function call
}

export interface RedisLockDeleteConfig {
    onCompletion?: boolean; // if the business logic is completed, delete the key
    onError?: boolean; // if the business logic is not completed, delete the key
}

export interface RedisLockConfig {
    appendKeyInfos?: KeyInfo[]; // append key infos to the key in the redis
    threshold?: number; // number of requests allowed in the time duration
    expire?: number; // in seconds
    deleteConfig?: RedisLockDeleteConfig; // delete config for the key in the redis
}
