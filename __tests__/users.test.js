import { afterAll, beforeAll, expect, test } from 'vitest'
import fastify from 'fastify'
import dotenv from 'dotenv'
import server from '../server/index.js'
import { signUp } from '../server/routes'


dotenv.config({ path: '.env.example' })

/** @type {typeof fastify} */
let app;

beforeAll(async () => {
    app = await server(fastify())
})

test('new user', async () => {
    const res = await app.inject({ method: 'GET', url: signUp() })
    expect(res.statusCode).toBe(200)
})

afterAll(async () => {
    await app.close()
})