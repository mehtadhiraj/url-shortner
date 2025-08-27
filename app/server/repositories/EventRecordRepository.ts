import { Model } from 'objection';
import { Service } from 'typedi';
import { Entity, IdColumn } from '@tsed/objection';
import { EventRecordObject, StatsResponse } from '../../types';

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
    async create(data: EventRecordObject): Promise<EventRecordObject> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        return EventRecordModel.query().insert(data);
    }

    async bulkCreate(data: EventRecordObject[]): Promise<EventRecordObject[]> {
        const records = data.map(item => ({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        return EventRecordModel.query().insert(records);
    }

    async findByShortlinkId(shortlinkId: string): Promise<EventRecordObject | null> {
        return EventRecordModel.query().where({ shortlinkId }).first();
    }

    async findByShortlinkIdAndEventType(shortlinkId: string, eventType: string): Promise<EventRecordObject | null> {
        return EventRecordModel.query().where({ shortlinkId, eventType }).first();
    }

    async getStats(alias: string, startDate: string, endDate: string): Promise<EventRecordObject[]> {
        const stats = await EventRecordModel.query().where({ alias }).where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
        return stats;
    }
}