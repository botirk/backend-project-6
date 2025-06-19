/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => knex.schema.createTable('tasks_labels', (table) => {
  table.increments('id');
  table.integer('taskId').notNullable().references('id').inTable('tasks');
  table.integer('labelId').notNullable().references('id').inTable('labels');
});

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => knex.schema.dropTable('tasks_labels');
