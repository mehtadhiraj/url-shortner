import 'reflect-metadata';
import * as path from 'path';
import { TSConvict } from 'ts-convict';
import { Postgres } from '../../config/Database';

const dbLoader = new TSConvict < Postgres >(Postgres);
const dbConfig = dbLoader.load();

interface KnexConfig {
    client: 'pg';
    connection: string;
    migrations: {
        directory: string;
    };
}

const knexConfig: KnexConfig = {
    client: 'pg',
    connection: dbConfig.url,
    migrations: {
        directory: path.join(__dirname, './migrations'),
    },
};

export default knexConfig;
