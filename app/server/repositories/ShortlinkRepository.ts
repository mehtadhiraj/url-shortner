import { Model } from 'objection';
import { Service } from 'typedi';
import { Entity, IdColumn } from '@tsed/objection';
import { ShortlinkObject } from 'app/types';

@Entity('shortlink')
class ShortlinkModel extends Model implements ShortlinkObject {
    @IdColumn()
    id!: string;
    url!: string;
    campaignId!: string;
    alias!: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Service()
export class ShortlinkRepository {
    async create(data: ShortlinkObject): Promise<ShortlinkObject> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        return ShortlinkModel.query().insert(data);
    }

    async findByAlias(alias: string): Promise<ShortlinkObject | null> {
        return ShortlinkModel.query().where({ alias }).first();
    }

    async findByCampaignIdAndUrl(campaignId: string, url: string): Promise<ShortlinkObject | null> {
        return ShortlinkModel.query().where({ campaignId, url }).first();
    }
}