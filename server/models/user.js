import { Model as Model } from 'objection'
import crypto from 'crypto'

export const encrypt = (value) => crypto.createHash('sha256').update(value).digest('hex')

export default class User extends Model {
    static get tableName() {
        return 'users'
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
            },
        }
    }

    set password(password) {
        super.password = encrypt(password)
    }

    get password() {
        return super.password
    }


    verifyPassword(password) {
        return encrypt(password) === this.password;
    }
}