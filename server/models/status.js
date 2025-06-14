import { Model } from 'objection'

export default class Status extends Model {
    static get tableName() {
        return 'statuses'
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name'],
            properties: {
                id: { type: 'integer' },
                name: { type: 'string', minLength: 1 },
                createDate: { type: 'string', format: 'date-time' }
            },
        }
    }
}