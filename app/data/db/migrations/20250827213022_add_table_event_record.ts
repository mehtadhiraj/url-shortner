import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await knex.schema.createTable('eventRecord', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('alias').notNullable().index();
        table.timestamp('timestamp').notNullable().index();
        table.string('eventType').notNullable();
        table.jsonb('eventData').nullable();
        table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
        table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());
        // alias to reffer alias column of shortlink table
        table.foreign('alias').references('alias').inTable('shortlink');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('eventRecord');
}

