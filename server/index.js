import { fileURLToPath } from 'node:url';
import path from 'path';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyFormbody from '@fastify/formbody';
import fastifySensible from '@fastify/sensible';
import qs from 'qs';
import Pug from 'pug';
import i18next from 'i18next';
import Knex from 'knex';
import Rollbar from 'rollbar';
import models from './models/index.js';
import ru from './locales/ru.js';
import addRoutes, { paths } from './routes/index.js';
import * as knexConfig from '../knexfile.js';
import addAuth from './auth.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));
const mode = process.env.NODE_ENV || 'development';

const setUpViews = (app) => {
  app.addHook('preHandler', async (req, res) => {
    // eslint-disable-next-line
    res.locals = { isAuthenticated: () => req.isAuthenticated() };
  });
  app.register(fastifyView, {
    engine: { pug: Pug },
    defaultContext: {
      paths,
      t: (key) => i18next.t(key),
      timestamp: (date) => new Date(date).toLocaleString(),
    },
    templates: path.join(__dirname, '..', 'server', 'views'),
  });
  app.decorateReply('render', function render(viewPath, vars) {
    return this.view(viewPath, { errors: {}, ...vars, flash: this.flash() ?? [] });
  });
};

const registerPlugins = async (app) => {
  await app.register(fastifySensible);
  await app.register(fastifyFormbody, { parser: qs.parse });
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'dist'),
    prefix: '/dist/',
  });

  // eslint-disable-next-line
  const knex = Knex(knexConfig[mode]);
  if (mode !== 'production') await knex.raw('PRAGMA foreign_keys = ON;');
  await knex.migrate.latest();
  // eslint-disable-next-line
  for (const model of Object.values(models)) model.knex(knex);
  app.decorate('models', models);
  app.decorate('objection', { models, knex });
};

const setupLocalization = async () => {
  await i18next
    .init({
      lng: 'ru',
      resources: {
        ru,
      },
    });
};

// eslint-disable-next-line
export default async (app, _options) => {
  await addAuth(app);
  await registerPlugins(app);

  await setupLocalization();
  setUpViews(app);
  addRoutes(app);

  if (process.env.ROLLBAR_TOKEN) {
    new Rollbar({
      accessToken: process.env.ROLLBAR_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true,
    }).log('Server started');
  }

  return app;
};
