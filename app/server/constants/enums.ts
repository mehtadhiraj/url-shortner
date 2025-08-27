export enum RedisPrefix {
    SHORTLINK = 'shortlink',
}

export enum StreamKey {
    SHORTLINK_CLICK = 'shortlink:click',
    SHORTLINK_CLICK_GROUP = 'shortlink:click:group',
    SHORTLINK_CLICK_DLQ = 'shortlink:click:dlq',
}