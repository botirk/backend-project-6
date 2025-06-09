import { afterAll, beforeAll, expect, test } from 'vitest'
import fastify from 'fastify'
import dotenv from 'dotenv'
import * as cheerio from 'cheerio'
import server from '../server/index.js'
import { paths } from '../server/routes'


dotenv.config({ path: '.env.example' })

/** @type {typeof fastify} */
let app;

beforeAll(async () => {
    app = await server(fastify())
})

test('new user', async () => {
    const res = await app.inject({ method: 'GET', url: paths.signUp() })
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.body)

    expect($('form')).length(1)

    expect($('input[name="data[firstName]"]')).length(1)

    expect($('input[name="data[lastName]"]')).length(1)

    expect($('input[name="data[email]"]')).length(1)

    expect($('input[name="data[password]"]')).length(1)
})

afterAll(async () => {
    await app.close()
})