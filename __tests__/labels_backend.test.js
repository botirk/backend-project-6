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

test.sequential('create label & get label & patch label & delete label', async () => {
  let res = await app.inject({ method: 'GET', url: paths.createLabel() });
  expect(res.statusCode).toBe(302);

  const inject = await login(app);

  expect(await app.models.label.query().findOne({ name: 'testLabelName' })).toBeFalsy();
  expect(await app.models.label.query().findOne({ name: 'changedLabelName' })).toBeFalsy();

  res = await inject({ method: 'GET', url: paths.createLabel() });
  expect(res.statusCode).toBe(200);

  res = await inject({
    method: 'POST',
    url: paths.labels(),
    payload: { data: { name: '' } },
  });
  expect(res.statusCode).toBe(400);

  res = await inject({
    method: 'POST',
    url: paths.labels(),
    payload: { data: { name: 'testLabelName' } },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.label.query().findOne({ name: 'testLabelName' })).toBeTruthy();

  res = await app.inject({ method: 'GET', url: paths.editLabel(1) });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.editLabel(1) });
  expect(res.statusCode).toBe(200);

  res = await inject({
    method: 'POST',
    url: paths.editDeleteLabel(1),
    payload: { data: { name: 'changedLabelName' }, _method: 'patch' },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.label.query().findOne({ name: 'testLabelName' })).toBeFalsy();
  expect(await app.models.label.query().findOne({ name: 'changedLabelName' })).toBeTruthy();

  res = await inject({
    method: 'POST',
    url: paths.editDeleteLabel(1),
    payload: { _method: 'delete' },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.label.query().findOne({ name: 'testLabelName' })).toBeFalsy();
  expect(await app.models.label.query().findOne({ name: 'changedLabelName' })).toBeFalsy();
});
