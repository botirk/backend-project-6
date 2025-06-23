import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import server from '../server/index.js';
import paths from '../server/routes/paths.js';
import { login } from './helper.js';

dotenv.config({ path: '.env.example' });

/** @type {require('fastify').Server} */
let app;

beforeAll(async () => {
  app = await server(fastify());
});

afterAll(async () => {
  await app.close();
});

test('new user', async () => {
  const res = await app.inject({ method: 'GET', url: paths.signUp() });
  expect(res.statusCode).toBe(200);
  const $ = cheerio.load(res.body);

  expect($(`form[method="post"][action="${paths.users()}"]`)).length(1);
  expect($('input[name="data[firstName]"]')).length(1);
  expect($('input[name="data[lastName]"]')).length(1);
  expect($('input[name="data[email]"]')).length(1);
  expect($('input[name="data[password]"]')).length(1);
});

test.sequential('post user & get user', async () => {
  let res = await app.inject({
    method: 'POST',
    url: paths.users(),
    payload: {
      data: {
        firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha', password: 'haha',
      },
    },
  });
  expect(res.statusCode).toBe(302);

  const get = await app.inject({ method: 'GET', url: paths.users() });
  expect(get.statusCode).toBe(200);
  const $ = cheerio.load(get.body);

  expect($('td:contains("1")')).length.greaterThanOrEqual(1);
  expect($('td:contains("testFirstName testLastName")')).length(1);
  expect($('td:contains("ha@ha.ha")')).length(1);

  res = await app.inject({
    method: 'POST',
    url: paths.users(),
    payload: {
      data: {
        firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha', password: 'haha',
      },
    },
  });
  expect(res.statusCode).toBe(400);
});

test.sequential('post user & edit user', async () => {
  const inject = await login(app);

  let edit = await inject({ method: 'GET', url: paths.editUser(1) });
  expect(edit.statusCode).toBe(302);

  edit = await inject({ method: 'GET', url: paths.editUser(2) });
  expect(edit.statusCode).toBe(200);
  let $ = cheerio.load(edit.body);

  expect($(`form[action="${paths.editDeleteUser(2)}"][method="post"]`)).length(1);
  expect($('input[name="data[firstName]"]')).length(1);
  expect($('input[name="data[lastName]"]')).length(1);
  expect($('input[name="data[email]"]')).length(1);
  expect($('input[name="data[password]"]')).length(1);

  edit = await inject({
    method: 'POST',
    url: paths.editDeleteUser(1),
    payload: {
      data: {
        firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail', password: 'changedUser',
      },
    },
  });
  expect(edit.statusCode).toBe(302);
  $ = cheerio.load(edit.body);

  edit = await inject({ method: 'GET', url: paths.users() });
  $ = cheerio.load(edit.body);

  expect($('td:contains("changedUser changedUser")')).length(0);
  expect($('td:contains("changedEmail")')).length(0);

  edit = await inject({
    method: 'POST',
    url: paths.editDeleteUser(2),
    payload: {
      data: {
        firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail', password: 'changedUser',
      },
    },
  });
  expect(edit.statusCode).toBe(302);

  edit = await inject({ method: 'GET', url: paths.users() });
  $ = cheerio.load(edit.body);

  expect($('td:contains("changedUser changedUser")')).length(1);
  expect($('td:contains("changedEmail")')).length(1);
});

test.sequential('post user & delete user', async () => {
  const inject = await login(app, 'anotherEmail');
  let del = await inject({ method: 'GET', url: paths.users() });
  let $ = cheerio.load(del.body);
  expect($('td:contains("anotherEmail")')).length(1);

  del = await inject({
    method: 'POST',
    url: paths.editDeleteUser(3),
    payload: { _method: 'delete' },
  });
  expect(del.statusCode).toBe(302);

  del = await app.inject({ method: 'GET', url: paths.users() });
  $ = cheerio.load(del.body);
  expect($('td:contains("anotherEmail")')).length(0);
});
