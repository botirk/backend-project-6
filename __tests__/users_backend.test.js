import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
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

test.sequential('post user & get user', async () => {
  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha' })).toBeFalsy();

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

  expect(await app.models.user.query().findOne({
    firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha', password: 'haha',
  })).toBeFalsy();
  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha' })).toBeTruthy();

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

  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha' })).toBeTruthy();

  let edit = await inject({ method: 'GET', url: paths.editUser(1) });
  expect(edit.statusCode).toBe(302);

  edit = await inject({ method: 'GET', url: paths.editUser(2) });
  expect(edit.statusCode).toBe(200);

  edit = await inject({
    method: 'POST',
    url: paths.editDeleteUser(1),
    payload: {
      _method: 'patch',
      data: {
        firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail', password: 'changedUser',
      },
    },
  });
  expect(edit.statusCode).toBe(302);

  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'ha@ha.ha' })).toBeTruthy();
  expect(await app.models.user.query().findOne({ firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail' })).toBeFalsy();

  edit = await inject({
    method: 'POST',
    url: paths.editDeleteUser(2),
    payload: {
      _method: 'patch',
      data: {
        firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail', password: 'changedUser',
      },
    },
  });
  expect(edit.statusCode).toBe(302);

  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'ho@ho.ho' })).toBeFalsy();
  expect(await app.models.user.query().findOne({ firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail' })).toBeTruthy();
  expect(await app.models.user.query().findOne({
    firstName: 'changedUser', lastName: 'changedUser', email: 'changedEmail', password: 'changedUser',
  })).toBeFalsy();
});

test.sequential('post user & delete user', async () => {
  expect(await app.models.user.query().findOne({ email: 'anotherEmail' })).toBeFalsy();
  const inject = await login(app, 'anotherEmail');
  expect(await app.models.user.query().findOne({ email: 'anotherEmail' })).toBeTruthy();

  const del = await inject({
    method: 'POST',
    url: paths.editDeleteUser(3),
    payload: { _method: 'delete' },
  });
  expect(del.statusCode).toBe(302);
  expect(await app.models.user.query().findOne({ email: 'anotherEmail' })).toBeFalsy();
});
