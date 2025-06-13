import { afterAll, beforeAll, expect, test } from 'vitest'
import fastify from 'fastify'
import dotenv from 'dotenv'
import * as cheerio from 'cheerio'
import server from '../server/index.js'
import { paths } from '../server/routes'
import { login } from './helper.js'

dotenv.config({ path: '.env.example' })

/** @type {typeof fastify} */
let app;

beforeAll(async () => {
    app = await server(fastify())
})

test('post user & get login & login', async () => {
    let res = await app.inject({ 
        method: 'POST', url: paths.users(), 
        payload: { data: { firstName: 'testFirstName', lastName: 'testLastName', email: 'he@he.he', password: 'hehe' }}  
    })
    expect(res.statusCode).toBe(302)

    const get = await app.inject({ method: 'GET', url: paths.login() })
    expect(get.statusCode).toBe(200)
    const $ = cheerio.load(get.body)

    expect($('form')).length(1)

    expect($('input[name="data[email]"]')).length(1)

    expect($('input[name="data[password]"]')).length(1)

    res = await app.inject({ 
        method: 'POST', url: paths.session(), 
        payload: { data: { email: 'he@he.he', password: 'haha' }}  
    })
    expect(res.statusCode).toBe(401)

    res = await app.inject({ 
        method: 'POST', url: paths.session(), 
        payload: { data: { email: 'he@he.he', password: 'hehe' }}  
    })
    expect(res.statusCode).toBe(302)
})

test('logout button', async () => {
    const inject = await login(app)
    
    let res = await inject({ method: 'GET', url: paths.main() })
    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.body)

    expect($(`form[method="post"][action="${paths.session()}"] input[value="delete"][type="hidden"]`)).length(1)

    res = await inject({ method: 'POST', url: paths.session(), payload: { _method: 'delete' }})
    expect(res.statusCode).toBe(302)
})

afterAll(async () => {
    await app.close()
})