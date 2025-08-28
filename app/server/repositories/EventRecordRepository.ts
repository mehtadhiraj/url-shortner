import { Model } from 'objection';
import { Service } from 'typedi';
import { Entity, IdColumn } from '@tsed/objection';
import { EventRecordObject } from '../../types';
import { getRedisInstance } from '../../data/RedisProvider';

@Entity('eventRecord')
class EventRecordModel extends Model implements EventRecordObject {
    @IdColumn()
    id?: string;
    alias: string;
    timestamp: string;
    eventType: string;
    eventData: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

@Service()
export class EventRecordRepository {
    private async getRedisInstance() {
        return await getRedisInstance();
    }

    async create(data: EventRecordObject): Promise<EventRecordObject> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        return await EventRecordModel.query().insert(data);
    }

    async bulkCreate(data: EventRecordObject[]): Promise<EventRecordObject[]> {
        const records = data.map(item => ({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        return EventRecordModel.query().insert(records);
    }

    async getStats(alias: string, startDate: string, endDate: string): Promise<EventRecordObject[]> {
        const redisStats = await (await this.getRedisInstance()).get(`eventRecord:${alias}:${startDate}:${endDate}`);
        if (redisStats) {
            return JSON.parse(redisStats);
        }
        const stats = await EventRecordModel.query().where({ alias }).where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
        await (await this.getRedisInstance()).set(`eventRecord:${alias}:${startDate}:${endDate}`, JSON.stringify(stats), 'EX', 60 * 60 * 24); // Expiry 1 day
        return stats;
    }
}