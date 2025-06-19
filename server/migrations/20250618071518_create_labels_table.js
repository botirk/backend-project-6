/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => knex.schema.createTable('labels', (table) => {
  table.increments('id');
  table.string('name').notNullable().unique();
  table.timestamp('createDate').notNullable().defaultTo(knex.fn.now());
});

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => knex.schema.dropTable('labels');
