import { Model } from 'objection';
import { Service } from 'typedi';
import { Entity, IdColumn } from '@tsed/objection';
import { ShortlinkObject } from 'app/types';
import { getRedisInstance } from '../../data/RedisProvider';

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
    private async getRedisInstance() {
        return await getRedisInstance();
    }

    async create(data: ShortlinkObject): Promise<ShortlinkObject> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        const shortlink = await ShortlinkModel.query().insert(data);
        await (await this.getRedisInstance()).set(`shortlink:${shortlink.alias}`, JSON.stringify(shortlink), 'EX', 60 * 60 * 24); // Expiry 1 day
        return shortlink;
    }

    async findByAlias(alias: string): Promise<ShortlinkObject | null> {
        const redisShortlink = await (await this.getRedisInstance()).get(`shortlink:${alias}`);
        if (redisShortlink) {
            return JSON.parse(redisShortlink);
        }
        const shortlink = await ShortlinkModel.query().where({ alias }).first();
        if (shortlink) {
            await (await this.getRedisInstance()).set(`shortlink:${alias}`, JSON.stringify(shortlink), 'EX', 60 * 60 * 24); // Expiry 1 day
        }
        return shortlink;
    }

    async findByCampaignIdAndUrl(campaignId: string, url: string): Promise<ShortlinkObject | null> {
        return ShortlinkModel.query().where({ campaignId, url }).first();
    }
}