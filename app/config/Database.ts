import { Property } from 'ts-convict';
import { config } from '../server/types';

export class Postgres implements config.Postgres {
    @Property({
        doc: 'The database host',
        default: 'localhost',
        format: String,
        env: 'DATABASE_HOST',
    })
    public host: string;

    @Property({
        doc: 'The database port',
        default: 5432,
        format: 'port',
        env: 'DATABASE_PORT',
    })
    public port: number;

    @Property({
        doc: 'The database db',
        default: 'my_db',
        env: 'DATABASE_DB',
    })
    public database: string;

    @Property({
        doc: 'The database user',
        default: 'magik',
        env: 'DATABASE_USER',
    })
    public user: string;

    @Property({
        doc: 'The database pass',
        default: 'secretpassword',
        sensitive: true,
        env: 'DATABASE_PASS',
    })
    public password: string;

    @Property({
        doc: 'The database connection url',
        default: 'postgres://admin:admin@127.0.0.1:5432/short_url_db',
        sensitive: true,
        env: 'POSTGRESS_URL',
    })
    public url: string;

    @Property({
        doc: 'The database minimum connection pool',
        default: 1,
        sensitive: true,
        env: 'DATABASE_MIN_CONNECTION_POOL',
    })
    public poolMin: number;

    @Property({
        doc: 'The database maximum connection pool size',
        default: 10,
        sensitive: true,
        env: 'DATABASE_MAX_CONNECTION_POOL',
    })
    public poolMax: number;

    @Property({
        doc: 'The database connection Idle timeout',
        default: 10000,
        sensitive: true,
        env: 'DATABASE_CONNECTION_POOL_IDLE_TIMEOUT',
    })
    public poolIdle: number;
}
