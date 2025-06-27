import { Model } from 'objection';
import { encryptPassword } from '../auth.js';

export default class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', minLength: 1 },
        password: { type: 'string', minLength: 1 },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        createDate: { type: 'string', format: 'date-time' },
      },
    };
  }

  static fromJsonWithPassword(json) {
    const validUser = this.fromJson(json);
    validUser.password = encryptPassword(validUser.password);
    return validUser;
  }
}
