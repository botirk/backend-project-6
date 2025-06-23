import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { login } from './helper';
import server from '../server';
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
  res = await inject({ method: 'GET', url: paths.createLabel() });
  expect(res.statusCode).toBe(200);
  let $ = cheerio.load(res.body);
  expect($(`form[action="${paths.labels()}"][method="post"]`)).length(1);
  expect($('input[name="data[name]"]')).length(1);

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

  res = await inject({ method: 'GET', url: paths.labels() });
  expect(res.statusCode).toBe(200);
  $ = cheerio.load(res.body);
  expect($(`a[href="${paths.createLabel()}"]`)).length(1);
  expect($('td:contains("1")')).length.greaterThanOrEqual(1);
  expect($('td:contains("testLabelName")')).length(1);
  expect($(`form[action="${paths.editDeleteLabel(1)}"][method="post"]`)).length(1);
  expect($(`a[href="${paths.editLabel(1)}"]`)).length(1);

  res = await app.inject({ method: 'GET', url: paths.editLabel(1) });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.editLabel(1) });
  expect(res.statusCode).toBe(200);
  $ = cheerio.load(res.body);
  expect($(`form[action="${paths.editDeleteLabel(1)}"][method="post"]`)).length(1);
  expect($('input[name="_method"][value="patch"]')).length(1);
  expect($('input[name="data[name]"]')).length(1);

  res = await inject({
    method: 'POST',
    url: paths.editDeleteLabel(1),
    payload: { data: { name: 'changedLabelName' }, _method: 'patch' },
  });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.labels() });
  expect(res.statusCode).toBe(200);
  $ = cheerio.load(res.body);
  expect($('td:contains("1")')).length.greaterThanOrEqual(1);
  expect($('td:contains("testLabelName")')).length(0);
  expect($('td:contains("changedLabelName")')).length(1);

  res = await inject({
    method: 'POST',
    url: paths.editDeleteLabel(1),
    payload: { _method: 'delete' },
  });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.labels() });
  expect(res.statusCode).toBe(200);
  $ = cheerio.load(res.body);
  expect($('td:contains("testLabelName")')).length(0);
  expect($('td:contains("changedLabelName")')).length(0);
});
