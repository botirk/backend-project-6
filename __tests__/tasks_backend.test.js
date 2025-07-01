import {
  afterAll, beforeAll, expect, test,
} from 'vitest';
import fastify from 'fastify';
import dotenv from 'dotenv';
import {
  createLabel, createStatus, deleteStatus, login,
} from './helper.js';
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

test('tasks create page', async () => {
  let res = await app.inject({ method: 'GET', url: paths.createTask() });
  expect(res.statusCode).toBe(302);

  const inject = await login(app);
  res = await inject({ method: 'GET', url: paths.createTask() });
  expect(res.statusCode).toBe(200);
});

test.sequential('create task & read task & edit task & read task & delete task', async () => {
  const inject = await login(app);
  let res = await inject(createStatus());
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({
    name: 'testTask', description: 'testDescription', statusId: '1', executorId: '1',
  })).toBeFalsy();

  res = await inject({
    method: 'POST',
    url: paths.tasks(),
    payload: {
      data: {
        name: 'testTask', description: 'testDescription', statusId: '1', executorId: '1',
      },
    },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({
    name: 'testTask', description: 'testDescription', statusId: '1', executorId: '1',
  })).toBeTruthy();

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) });
  expect(res.statusCode).toBe(200);

  res = await inject({ method: 'GET', url: paths.editTask(1) });
  expect(res.statusCode).toBe(200);

  res = await inject({ method: 'GET', url: paths.editTask(2) });
  expect(res.statusCode).toBe(302);

  res = await inject(createStatus('anotherStatus'));
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({ name: 'anotherName', description: 'anotherDescription', statusId: '2' })).toBeFalsy();

  res = await inject({
    method: 'POST',
    url: paths.showEditDeleteTask(1),
    payload: {
      _method: 'patch',
      data: {
        name: 'anotherName', description: 'anotherDescription', statusId: '2', executorId: '',
      },
    },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({
    name: 'testTask', description: 'testDescription', statusId: '1', executorId: '1',
  })).toBeFalsy();
  expect(await app.models.task.query().findOne({ name: 'anotherName', description: 'anotherDescription', statusId: '2' })).toBeTruthy();

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) });
  expect(res.statusCode).toBe(200);

  res = await inject({ method: 'POST', url: paths.showEditDeleteTask(1), payload: { _method: 'delete' } });
  expect(res.statusCode).toBe(302);

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(1) });
  expect(res.statusCode).toBe(404);

  res = await inject(deleteStatus(1));
  expect(res.statusCode).toBe(302);

  res = await inject(deleteStatus(2));
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({ name: 'anotherName', description: 'anotherDescription', statusId: '2' })).toBeFalsy();
});

test.sequential('create task with label & read task with label', async () => {
  expect(await app.models.task.query().findOne({
    name: 'testTask', description: 'testDescription', statusId: '3', executorId: '1',
  })).toBeFalsy();

  const inject = await login(app);

  let res = await inject(createLabel('label1'));
  expect(res.statusCode).toBe(302);

  res = await inject(createLabel('label2'));
  expect(res.statusCode).toBe(302);

  res = await inject(createStatus('myStatus'));

  res = await inject({
    method: 'POST',
    url: paths.tasks(),
    payload: {
      data: {
        name: 'testTask', description: 'testDescription', statusId: '3', executorId: '1', labels: ['1', '2'],
      },
    },
  });
  expect(res.statusCode).toBe(302);

  expect(await app.models.task.query().findOne({
    name: 'testTask', description: 'testDescription', statusId: '3', executorId: '1',
  }).withGraphFetched({ labels: true }))
    .toMatchObject({
      name: 'testTask', description: 'testDescription', statusId: 3, executorId: 1, id: 2, labels: [{ id: 1, name: 'label1' }, { id: 2, name: 'label2' }],
    });
});

test.sequential('create task with fake labels', async () => {
  const inject = await login(app);

  let res = await inject({
    method: 'POST',
    url: paths.tasks(),
    payload: {
      data: {
        name: 'fakeTask', description: 'fakeDescription', statusId: '1', executorId: '1', labels: '100,2323',
      },
    },
  });
  expect(res.statusCode).toBe(400);

  res = await inject({ method: 'GET', url: paths.showEditDeleteTask(3) });
  expect(res.statusCode).toBe(404);
});
