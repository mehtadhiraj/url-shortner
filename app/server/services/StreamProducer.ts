import { Inject, Service } from 'typedi';
import RedisStreamsProvider from '../../data/RedisStreamsProvider';
import { StreamProducerOptions } from '../../types/streams';
import { Logger } from '../../../libs/logs/logger';
import RedisProvider from '../../data/RedisProvider';

@Service()
export class StreamProducer {
    constructor(@Inject() private redisStreamsProvider: RedisStreamsProvider) {}

    public async init(): Promise<void> {
        Logger.info('Initializing Redis Streams Producer...');
        await RedisProvider.getRedisInstance();
        Logger.info('Redis Streams Producer initialized');
    }

    /**
     * Publish a message to a Redis Stream
     */
    public async publishMessage(
        streamName: string,
        fields: Record<string, string>,
        options?: StreamProducerOptions
    ): Promise<string> {
        try {
            Logger.info(`Publishing message to stream ${streamName}`);
            
            const messageId = await this.redisStreamsProvider.addToStream(
                streamName,
                fields,
                options
            );
            
            Logger.info(`Message published to stream ${streamName} with ID: ${messageId}`);
            return messageId;
        } catch (error: any) {
            Logger.error(`Failed to publish message to stream ${streamName}: ${error.message}`);
            throw error;
        }
    }
} 