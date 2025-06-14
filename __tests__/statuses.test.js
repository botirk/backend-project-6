import { afterAll, beforeAll, expect, test } from "vitest";
import fastify from "fastify";
import dotenv from 'dotenv'
import * as cheerio from "cheerio";
import { login } from "./helper";
import server from "../server";
import { paths } from "../server/routes";

dotenv.config({ path: '.env.example' })

/** @type {require('fastify').Server} */
let app;

beforeAll(async () => {
    app = await server(fastify())
})

afterAll(async () => {
    await app.close()
})

test.sequential('create status & get status & patch status & delete status', async() => {
    let res = await app.inject({ method: 'GET', url: paths.createStatus() })
    expect(res.statusCode).toBe(302)

    const inject = await login(app)
    res = await inject({ method: 'GET', url: paths.createStatus() })
    expect(res.statusCode).toBe(200)
    let $ = cheerio.load(res.body)
    expect($(`form[action="${paths.statuses()}"][method="post"]`)).length(1)
    expect($('input[name="data[name]"]')).length(1)

    res = await inject({ 
        method: 'POST', url: paths.statuses(),
        payload: { data: { name: 'testStatusName' }}
    })
    expect(res.statusCode).toBe(302)

    res = await inject({ method: 'GET', url: paths.statuses() })
    expect(res.statusCode).toBe(200)
    $ = cheerio.load(res.body)
    expect($(`a[href="${paths.createStatus()}"]`)).length(1)
    expect($('td:contains("1")')).length.greaterThanOrEqual(1)
    expect($('td:contains("testStatusName")')).length(1)
    expect($(`form[action="${paths.editDeleteStatus(1)}"][method="post"]`)).length(1)
    expect($(`a[href="${paths.editStatus(1)}"]`)).length(1)

    res = await app.inject({ method: 'GET', url: paths.editStatus(1) })
    expect(res.statusCode).toBe(302)

    res = await inject({ method: 'GET', url: paths.editStatus(1) })
    expect(res.statusCode).toBe(200)
    $ = cheerio.load(res.body)
    expect($(`form[action="${paths.editDeleteStatus(1)}"][method="post"]`)).length(1)
    expect($('input[name="_method"][value="patch"]')).length(1)
    expect($('input[name="data[name]"]')).length(1)

    res = await inject({ 
        method: 'POST', url: paths.editDeleteStatus(1), 
        payload: { data:  { name: 'changedStatusName' }, _method: 'patch' } 
    })
    expect(res.statusCode).toBe(302)
    
    res = await inject({ method: 'GET', url: paths.statuses() })
    expect(res.statusCode).toBe(200)
    $ = cheerio.load(res.body)
    expect($('td:contains("1")')).length.greaterThanOrEqual(1)
    expect($('td:contains("testStatusName")')).length(0)
    expect($('td:contains("changedStatusName")')).length(1)

    res = await inject({ 
        method: 'POST', url: paths.editDeleteStatus(1), 
        payload: { _method: 'delete' }
    })
    expect(res.statusCode).toBe(302)

    res = await inject({ method: 'GET', url: paths.statuses() })
    expect(res.statusCode).toBe(200)
    $ = cheerio.load(res.body)
    expect($('td:contains("testStatusName")')).length(0)
    expect($('td:contains("changedStatusName")')).length(0)
})