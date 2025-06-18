/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('tasks_labels', function(table) {
    table.increments('id')
    table.integer('taskId').notNullable().references('id').inTable('tasks')
    table.integer('labelId').notNullable().references('id').inTable('labels')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('tasks_labels')
}
