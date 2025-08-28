import { Property } from 'ts-convict';
import { Redis as RedisType } from '../types';

export class Redis implements RedisType {
    @Property({
        doc: 'The database connection url',
        default: 'localhost:6379',
        sensitive: true,
        env: 'REDIS_URL',
    })
    public url: string;

    @Property({
        doc: 'Redis Streams configuration',
        default: {
            consumerGroup: 'default-group',
            consumerName: 'default-consumer',
            blockTime: 5000,
            maxRetries: 3,
            readCount: 100,
        }
    })
    public streams: {
        consumerGroup: string;
        consumerName: string;
        blockTime: number;
        maxRetries: number;
        readCount: number;
    };
}
