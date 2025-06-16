/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.increments('id')
    table.string('name').notNullable()
    table.string('description')
    table.integer('statusId').notNullable().references('id').inTable('statuses')
    table.integer('creatorId').notNullable().references('id').inTable('users')
    table.integer('executorId').references('id').inTable('users')
    table.timestamp('createDate').notNullable().defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('tasks')
};
