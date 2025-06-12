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

    expect($(`form[method="post"][action="${paths.users()}"]`)).length(1)
})

test('post user & get user', async () => {
    const res = await app.inject({ 
        method: 'POST', url: paths.users(), 
        payload: { data: {firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha', password: 'haha' }}  
    })
    expect(res.statusCode).toBe(302)

    const get = await app.inject({ method: 'GET', url: paths.users() })
    expect(get.statusCode).toBe(200)
    const $ = cheerio.load(get.body)

    expect($('td:contains("1")')).length(1)

    expect($('td:contains("testFirstName testLastName")')).length(1)

    expect($('td:contains("ha@ha.ha")')).length(1)


})

afterAll(async () => {
    await app.close()
})