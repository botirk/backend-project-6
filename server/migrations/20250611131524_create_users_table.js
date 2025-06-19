/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => knex.schema.createTable('users', (table) => {
  table.increments('id');
  table.string('email').notNullable().unique();
  table.string('password').notNullable();
  table.string('firstName').notNullable();
  table.string('lastName').notNullable();
  table.timestamp('createDate').notNullable().defaultTo(knex.fn.now());
});

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => knex.schema.dropTable('users');
