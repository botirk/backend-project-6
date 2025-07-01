import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
import server from '../server/index.js';
import paths from '../server/routes/paths.js';

dotenv.config({ path: '.env.example' });

/** @type {typeof fastify} */
let app;

beforeAll(async () => {
  app = await server(fastify());
});

afterAll(async () => {
  await app.close();
});

test('post user & get login & login', async () => {
  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'he@he.he' })).toBeFalsy();

  let res = await app.inject({
    method: 'POST',
    url: paths.users(),
    payload: {
      data: {
        firstName: 'testFirstName', lastName: 'testLastName', email: 'he@he.he', password: 'hehe',
      },
    },
  });
  expect(res.statusCode).toBe(302);
  expect(await app.models.user.query().findOne({ firstName: 'testFirstName', lastName: 'testLastName', email: 'he@he.he' })).toBeTruthy();

  res = await app.inject({
    method: 'POST',
    url: paths.session(),
    payload: { data: { email: 'he@he.he', password: 'haha' } },
  });
  expect(res.statusCode).toBe(401);

  res = await app.inject({
    method: 'POST',
    url: paths.session(),
    payload: { data: { email: 'he@he.he', password: 'hehe' } },
  });
  expect(res.statusCode).toBe(302);
});
