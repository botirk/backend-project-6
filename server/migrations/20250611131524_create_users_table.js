/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id')
    table.string('email').notNullable().unique()
    table.string('password').notNullable()
    table.string('firstName').notNullable()
    table.string('lastName').notNullable()
    table.timestamp('createDate').notNullable().defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('users')
};
