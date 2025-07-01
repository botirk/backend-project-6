import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
import { login } from './helper.js';
import server from '../server/index.js';
import paths from '../server/routes/paths.js';

dotenv.config({ path: '.env.example' });

/** @type {require('fastify').Server} */
let app;

beforeAll(async () => {
  app = await server(fastify());
});

afterAll(async () => {
  await app.close();
});

test.sequential('create status & get status & patch status & delete status', async () => {
  let res = await app.inject({ method: 'GET', url: paths.createStatus() });
  expect(res.statusCode).toBe(302);

  const inject = await login(app);

  expect(await app.models.status.query().findOne({ name: 'testStatusName' })).toBeFalsy();
  expect(await app.models.status.query().findOne({ name: 'changedStatusName' })).toBeFalsy();

  res = await inject({ method: 'GET', url: paths.createStatus() });
  expect(res.statusCode).toBe(200);

  res = await inject({
    method: 'POST',
    url: paths.statuses(),
    payload: { data: { name: '' } },
  });
  expect(res.statusCode).toBe(400);

  res = await inject({
    method: 'POST',
    url: paths.statuses(),
    payload: { data: { name: 'testStatusName' } },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.status.query().findOne({ name: 'testStatusName' })).toBeTruthy();

  res = await app.inject({ method: 'GET', url: paths.editStatus(1) });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.editStatus(1) });
  expect(res.statusCode).toBe(200);

  res = await inject({
    method: 'POST',
    url: paths.editDeleteStatus(1),
    payload: { data: { name: 'changedStatusName' }, _method: 'patch' },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.status.query().findOne({ name: 'testStatusName' })).toBeFalsy();
  expect(await app.models.status.query().findOne({ name: 'changedStatusName' })).toBeTruthy();

  res = await inject({
    method: 'POST',
    url: paths.editDeleteStatus(1),
    payload: { _method: 'delete' },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.status.query().findOne({ name: 'testStatusName' })).toBeFalsy();
  expect(await app.models.status.query().findOne({ name: 'changedStatusName' })).toBeFalsy();
});
