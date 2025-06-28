import { Model } from 'objection';
import { createHash } from 'node:crypto';

const encryptPassword = (password) => createHash('sha256').update(password).digest('hex');

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

  static fromJson(json) {
    const result = super.fromJson(json);
    result.password = encryptPassword(result.password);
    return result;
  }

  static findUser(email, rawPassword) {
    return this.query().findOne({ email, password: encryptPassword(rawPassword) });
  }
}
