import { afterAll, beforeAll, expect, test } from 'vitest'
import fastify from 'fastify'
import dotenv from 'dotenv'
import * as cheerio from 'cheerio'
import { createLabel, createStatus, deleteStatus, login } from './helper'
import server from '../server'
import { paths } from '../server/routes'

dotenv.config({ path: '.env.example' })

/** @type {require('fastify').Server} */
let app

beforeAll(async () => {
  app = await server(fastify())
})

afterAll(async () => {
  await app.close()
})

test('tasks create page', async () => {
  let res = await app.inject({ method: 'GET', url: paths.createTask() })
  expect(res.statusCode).toBe(302)

  const inject = await login(app)
  res = await inject({ method: 'GET', url: paths.createTask() })
  expect(res.statusCode).toBe(200)
  let $ = cheerio.load(res.body)
  expect($(`form[action="${paths.tasks()}"][method="post"]`)).length(1)
  expect($('input[name="data[name]"]')).length(1)
  expect($('textarea[name="data[description]"]')).length(1)
  expect($('select[name="data[statusId]"]')).length(1)
  expect($('select[name="data[executorId]"]')).length(1)
  expect($('select[name="data[executorId]"] option[value="1"]')).length(1)
  expect($('select[name="data[labels]"][multiple="multiple"]')).length(1)
})

test.sequential('create task & read task & edit task & read task & delete task', async () => {
  const inject = await login(app)
  let res = await inject(createStatus())
  expect(res.statusCode).toBe(302)

  res = await inject({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: 'testTask', description: 'testDescription', statusId: '1', executorId: '1' } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks() })
  expect(res.statusCode).toBe(200)
  let $ = cheerio.load(res.body)
  expect($(`a[href="${paths.createTask()}"]`)).length(1)
  expect($('td:contains("1")')).length.greaterThanOrEqual(1)
  expect($('td:contains("testTask")')).length(1)
  expect($('td:contains("testStatus")')).length(1)
  expect($('td:contains("testUser testUser")')).length(2)
  expect($(`a[href="${paths.editTask(1)}"]`)).length(1)

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('*:contains("testDescription")')).length.greaterThanOrEqual(1)
  expect($('*:contains("testTask")')).length.greaterThanOrEqual(1)
  expect($('*:contains("testStatus")')).length.greaterThanOrEqual(1)
  expect($('*:contains("testUser testUser")')).length.greaterThanOrEqual(2)
  expect($(`a[href="${paths.editTask(1)}"]`)).length.greaterThanOrEqual(1)
  expect($(`form[method="post"]`)).length.greaterThanOrEqual(1)

  res = await inject({ method: 'GET', url: paths.editTask(1) })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($(`form[action="${paths.showEditDeleteTask(1)}"][method="post"]`)).length(1)
  expect($('input[name="data[name]"]')).length(1)
  expect($('textarea[name="data[description]"]')).length(1)
  expect($('select[name="data[statusId]"]')).length(1)
  expect($('select[name="data[executorId]"]')).length(1)
  expect($('select[name="data[executorId]"] option[value="1"]')).length(1)
  expect($('select[name="data[labels]"][multiple="multiple"]')).length(1)
  expect($('input[name="_method"][type="hidden"][value="patch"]')).length(1)

  res = await inject({ method: 'GET', url: paths.editTask(2) })
  expect(res.statusCode).toBe(302)

  res = await inject(createStatus('anotherStatus'))
  expect(res.statusCode).toBe(302)

  res = await inject({
    method: 'POST', url: paths.showEditDeleteTask(1),
    payload: { _method: 'patch', data: { name: 'anotherName', description: 'anotherDescription', statusId: '2', executorId: '' } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('*:contains("testDescription")')).length(0)
  expect($('*:contains("testTask")')).length(0)
  expect($('*:contains("testStatus")')).length(0)

  expect($('*:contains("anotherDescription")')).length.greaterThanOrEqual(1)
  expect($('*:contains("anotherName")')).length.greaterThanOrEqual(1)
  expect($('*:contains("anotherStatus")')).length.greaterThanOrEqual(1)

  res = await inject({ method: 'POST', url: paths.showEditDeleteTask(1), payload: { _method: 'delete' } })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) })
  expect(res.statusCode).toBe(404)

  res = await inject(deleteStatus(1))
  expect(res.statusCode).toBe(302)

  res = await inject(deleteStatus(2))
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks() })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($(`*:contains("testDescription")`)).length(0)
  expect($('*:contains("testTask")')).length(0)
  expect($('*:contains("testStatus")')).length(0)
})

test.sequential('create task with label & read task with label', async () => {
  const inject = await login(app)

  let res = await inject(createLabel('label1'))
  expect(res.statusCode).toBe(302)

  res = await inject(createLabel('label2'))
  expect(res.statusCode).toBe(302)

  res = await inject(createStatus('myStatus'))

  res = await inject({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: 'testTask', description: 'testDescription', statusId: '3', executorId: '1', labels: ['1', '2'] } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(2) })
  expect(res.statusCode).toBe(200)
  let $ = cheerio.load(res.body)
  expect($('div:contains("label1")')).length.greaterThanOrEqual(1)
  expect($('div:contains("label2")')).length.greaterThanOrEqual(1)
})

test.sequential('create task with fake labels', async () => {
  const inject = await login(app)

  let res = await inject({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: 'fakeTask', description: 'fakeDescription', statusId: '1', executorId: '1', labels: '100,2323' } },
  })
  expect(res.statusCode).toBe(400)

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(3) })
  expect(res.statusCode).toBe(404)
})

test.sequential('tasks filter', async () => {
  const inject = await login(app)

  let res = await inject(createStatus('noStatus'))
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks(), query: { status: '4' } })
  expect(res.statusCode).toBe(200)
  let $ = cheerio.load(res.body)
  expect($('tr')).length(1)

  res = await inject({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: 'testTask', description: 'testDescription', statusId: '4' } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks(), query: { status: '4' } })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('tr')).length(2)

  res = await inject({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: '123', description: 'testDescription', statusId: '4', labels: '1,2', executorId: '1' } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks() })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($(`*:contains("123")`)).length.greaterThanOrEqual(1)

  res = await inject({ method: 'GET', url: paths.tasks(), query: { status: '4', label: '1', executor: '1' } })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('tr')).length(2)

  const inject2 = await login(app, 'newemail')
  res = await inject2({
    method: 'POST', url: paths.tasks(),
    payload: { data: { name: '123', description: 'testDescription', statusId: '4', labels: '1,2', executorId: '1' } },
  })
  expect(res.statusCode).toBe(302)

  res = await inject({ method: 'GET', url: paths.tasks(), query: { status: '4', label: '1', executor: '1', isCreatorUser: 'yes' } })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('tr')).length(2)

  res = await inject({ method: 'GET', url: paths.tasks(), query: { status: '4', label: '1', executor: '1' } })
  expect(res.statusCode).toBe(200)
  $ = cheerio.load(res.body)
  expect($('tr')).length(3)
})
