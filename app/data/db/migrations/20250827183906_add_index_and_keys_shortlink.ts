import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('shortlink', (table) => {
        table.index('alias', 'shortlink_alias_index');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('shortlink', (table) => {
        table.dropIndex('alias', 'shortlink_alias_index');
    });
}

