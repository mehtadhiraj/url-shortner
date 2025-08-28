## URL Shortner

### Docker Compose: Setup and Run

Prerequisites:
- Docker Desktop (or Docker Engine) and Docker Compose

Quickstart (sandbox stack):

```bash
# From project root
docker-compose -f docker-compose.sandbox.yml up -d --build
```

What this starts:
- `redis` on port 6379
- `postgres` on port 5432 with a named volume `pgdata_sbx`
- `app` service on port 8500 (API)
- `consumer` service on port 8501 (background consumer)

The `app` container runs:
- `npm ci` → install deps
- `npm run build` → compile TypeScript to `dist`
- `npm run migrate` → run database migrations
- `npm run start` → start the API server

The `consumer` container runs:
- `npm ci` → install deps
- `npm run build` → compile TypeScript
- `npm run start` → start consumer process

To rebuild from scratch (pull fresh images, clear caches):
```bash
# Stop stack and remove volumes
docker-compose -f docker-compose.sandbox.yml down --volumes --remove-orphans
```

### API Testing
- Swagger UI: once containers are up, open `http://localhost:8500/swagger/ui` to explore and test the APIs. It may take some time to load, till then relax.

### Environment Variables (key knobs)
The compose file sets sane defaults. You can override them by editing `docker-compose.sandbox.yml` or passing env overrides.

- Base
  - `DEPLOYMENT_TYPE`: `APP` or `CONSUMER`. Controls runtime mode. Default: `APP` (for `app`), `CONSUMER` (for `consumer`).
  - `NODE_ENV`: Node environment. Default: `development`.
  - `PRINT_STACK_TRACE`: `true|false`. Include stack traces in errors. Default: `true` in compose.
  - `PORT`: Listening port. `app` defaults to `8500`, `consumer` to `8501`.
  - `HOSTNAME`: Public hostname/base. Default: `http://localhost`.
  - `API_ROOT`: API root path prefix. Default: ``.
  - `APP_BASE_URL`: Base URL used to generate short links. `app` defaults to `http://localhost:8500`.

- Postgres
  - `DATABASE_HOST`: Hostname for DB. Default: `postgres` (service name).
  - `DATABASE_PORT`: Port. Default: `5432`.
  - `DATABASE_DB`: Database name. Default: `short_url_db`.
  - `DATABASE_USER`: DB user. Default: `admin`.
  - `DATABASE_PASS`: DB password. Default: `admin`.
  - `POSTGRESS_URL`: Full connection string `postgres://user:pass@host:port/db`.
  - `DATABASE_MIN_CONNECTION_POOL`: Knex pool min. Default: `1`.
  - `DATABASE_MAX_CONNECTION_POOL`: Knex pool max. Default: `10`.
  - `DATABASE_CONNECTION_POOL_IDLE_TIMEOUT`: Pool idle ms. Default: `10000`.

- Redis
  - `REDIS_URL`: Redis connection URL. Default: `redis://redis:6379`.
  - Rate limit/lock settings (used by API Redis lock decorator):
    - `SHORTLINK_REDIS_THRESHOLD`: Requests allowed per window. Default: `10`.
    - `SHORTLINK_REDIS_EXPIRE`: Window length in seconds. Default: `60`.

- Consumer (streams)
  - `CONSUMER_NAME`: Consumer identity. Default: `ClickConsumer`.
  - Additional stream-related settings can be introduced via `app/types/streams.ts` and `app/config/Redis.ts` (if applicable).

Scenarios to test by tweaking envs:
- Increase throughput allowance: set `SHORTLINK_REDIS_THRESHOLD=100` for more requests per alias per window.
- Shorter rate window: set `SHORTLINK_REDIS_EXPIRE=10` for aggressive throttling.
- Point to an external Redis or Postgres by overriding `REDIS_URL` or `POSTGRESS_URL`.

### Database Indexes
- `shortlink` table
  - `alias`: unique and indexed (`shortlink_alias_index`). Optimizes alias resolution and prevents duplicates.
- `eventRecord` table
  - `alias`: indexed. Speeds up filtering stats per alias.
  - `timestamp`: indexed. Speeds up time-range queries for analytics.

### How Redis is used
- Request Locking / Rate Limiting: The API uses a `@RedisLock` decorator on selected endpoints (e.g., create short link) to perform a simple rate limit keyed by request attributes (like `campaignId`).
  - It composes a Redis key from a prefix plus request fields.
  - It enforces a threshold of allowed operations within an expiry window using Redis increments and TTL.
  - Threshold and expiry are configurable via `SHORTLINK_REDIS_THRESHOLD` and `SHORTLINK_REDIS_EXPIRE`.
- Shortlink caching: shortlink metadata is cached by alias with the key pattern `shortlink:alias` to speed up alias resolution and reduce DB reads.
- Analytics caching: aggregated click stats are cached per alias and time window using the pattern `eventRecord:alias:startDate:endDate` for a configured duration to avoid repeated heavy queries.
- General caching/locking primitives are provided via `app/data/RedisProvider.ts` and used across services/decorators.
- Redis Streams: The project includes a consumer (`consumer` service) that can read from Redis Streams for click tracking and analytics. See `app/data/RedisStreamsProvider.ts` and `app/consumer/ClickStreamConsumer.ts`.

### Video Walkthrough
- Database schema and Redis usage: [Loom recording](https://www.loom.com/share/0fa7e7a581204b4696fb72aefef1be56?sid=491da533-abb2-48d9-a2c1-7695abb64b7c)
- Redis Streams usage: [Loom recording](https://www.loom.com/share/e3ec5ff077e448579929bd7901475e19?sid=ab35fb6f-396a-42f5-998e-a52b74adb068)

### Troubleshooting / Logs
- Check consumer logs to verify messages processing:
```bash
docker logs url-shortner-consumer-sbx -f | cat
```
- Check app server logs (API errors, request handling):
```bash
# Tail app server logs
docker logs url-shortner-app-sbx -f | cat
```

### Next Steps
- Analytics bucketing
  - Create hourly and daily aggregate tables (e.g., `eventRecord_hourly`, `eventRecord_daily`) to avoid scanning raw events for analytics queries.
  - Consider time-series options for scale: TimescaleDB (Postgres extension with hypertables), ClickHouse or equivalent depending on SLA and cost.
- Message consumption batching
  - Batch incoming events in the consumer (e.g., size 100–1000 or time-based flush) and perform bulk inserts in a single transaction to reduce write amplification.
  - Use Knex bulk `insert([...])` for higher throughput; ensure idempotency keys to avoid duplicates on retries.
  - Tune DB pool sizes and commit frequency; monitor latency vs. batch size trade-offs.
