import { Redis } from 'ioredis';
import { Logger } from '../../libs/logs/logger';
import { 
    StreamConsumerOptions, 
    StreamProducerOptions,
    StreamConsumerMessage,
} from '../types/streams';
import RedisProvider from './RedisProvider';
import { Service } from 'typedi';

@Service()
export class RedisStreamsProvider {
    private redis: any;
    constructor() {
    }

    /**
     * Add a message to a Redis Stream
     */
    public async addToStream(
        streamName: string, 
        fields: Record<string, string>, 
        options?: StreamProducerOptions
    ): Promise<string> {
        await this.ensureConnection();
        
        try {
            const args: any[] = [streamName];
            
            if (options?.maxLength) {
                if (options.approximateMaxLength) {
                    args.push('MAXLEN', '~', options.maxLength);
                } else {
                    args.push('MAXLEN', options.maxLength);
                }
            }
            
            args.push('*'); // Auto-generate ID
            
            // Convert fields to Redis format
            for (const [key, value] of Object.entries(fields)) {
                args.push(key, String(value));
            }
            
            const messageId = await (this.redis as any).xadd(...args);
            Logger.info(`Message added to stream ${streamName} with ID: ${messageId}`);
            return messageId;
        } catch (error: any) {
            Logger.error(`Error adding message to stream ${streamName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a consumer group for a stream
     */
    public async createConsumerGroup(
        streamName: string, 
        groupName: string, 
        startId: string = '0'
    ): Promise<void> {
        await this.ensureConnection();
        
        try {
            // MKSTREAM creates stream if missing; $ means start from the end for new group
            await (this.redis as any).xgroup('CREATE', streamName, groupName, startId, 'MKSTREAM');
            Logger.info(`Consumer group ${groupName} created for stream ${streamName}`);
        } catch (error: any) {
            if (error?.message && error.message.includes('BUSYGROUP')) {
                Logger.info(`Consumer group ${groupName} already exists for stream ${streamName}`);
            } else {
                Logger.error(`Error creating consumer group ${groupName} for stream ${streamName}: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * Read messages from a stream using consumer group
     */
    public async readFromStream(options: StreamConsumerOptions): Promise<StreamConsumerMessage[]> {
        await this.ensureConnection();
        
        try {
            const {
                streamName,
                consumerGroup,
                consumerName,
                blockTime = 5000,
                count = 10
            } = options;

            const result = await (this.redis as any).xreadgroup(
                'GROUP', consumerGroup, consumerName,
                'COUNT', count,
                'BLOCK', blockTime,
                'STREAMS', streamName, '>'
            );

            if (!result) {
                return [];
            }

            const messages: StreamConsumerMessage[] = [];
            
            for (const stream of (result as any[])) {
                const [name, entries] = stream;
                for (const [id, fields] of entries) {
                    const fieldsObj: Record<string, string> = {};
                    for (let i = 0; i < fields.length; i += 2) {
                        fieldsObj[fields[i]] = fields[i + 1];
                    }
                    
                    messages.push({
                        streamName: name,
                        id,
                        fields: fieldsObj,
                        timestamp: this.extractTimestampFromId(id)
                    });
                }
            }

            return messages;
        } catch (error: any) {
            Logger.error(`Error reading from stream ${options.streamName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Acknowledge message processing
     */
    public async ackMessage(
        streamName: string, 
        consumerGroup: string, 
        messageIds: string[]
    ): Promise<number> {
        await this.ensureConnection();
        
        try {
            const result = await (this.redis as any).xack(streamName, consumerGroup, ...messageIds);
            Logger.debug(`Acknowledged message ${messageIds.length} in stream ${streamName}`);
            return result;
        } catch (error: any) {
            Logger.error(`Error acknowledging message ${messageIds.length} in stream ${streamName}: ${error.message}`);
            throw error;
        }
    }

    /** Public: atomic counter with TTL (for retry attempts). */
    public async incrWithTtl(keys: string[], ttlSec: number): Promise<number> {
        await this.ensureConnection();
        const n = await this.redis.incr(...keys);
        await this.redis.expire(...keys, ttlSec);
        return n;
    }

    /** Public: get integer value (default 0). */
    public async getInt(key: string): Promise<number> {
        await this.ensureConnection();
        const v = await this.redis.get(key);
        return v ? parseInt(v, 10) : 0;
    }

    /** Public: delete key. */
    public async delKey(keys: string[]): Promise<void> {
        await this.ensureConnection();
        await this.redis.del(...keys);
    }

    private async ensureConnection(): Promise<void> {
        this.redis = await RedisProvider.getRedisInstance();
    }

    private extractTimestampFromId(id: string): number {
        const [timestamp] = id.split('-');
        return parseInt(timestamp, 10);
    }
}

export default RedisStreamsProvider; 