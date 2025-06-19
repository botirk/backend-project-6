import { Model } from 'objection';

export default class TasksLabels extends Model {
  static get tableName() {
    return 'tasks_labels';
  }
}
