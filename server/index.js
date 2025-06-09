// @ts-check

import { fileURLToPath } from 'url';
import path from 'path';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyFormbody from '@fastify/formbody';
import fastifySecureSession from '@fastify/secure-session';
import fastifySensible from '@fastify/sensible';
import { plugin as fastifyReverseRoutes } from 'fastify-reverse-routes';
import qs from 'qs';
import Pug from 'pug';
import addRoutes, { paths } from './routes/index.js';
import i18next from 'i18next';
import en from './locales/en.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

const setUpViews = (app) => {
  app.register(fastifyView, {
    engine: {
      pug: Pug,
    },
    defaultContext: {
      ...paths,
      t: (key) => i18next.t(key),
    },
    templates: path.join(__dirname, '..', 'server', 'views'),
  });

  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const registerPlugins = async (app) => {
  await app.register(fastifySensible);
  await app.register(fastifyReverseRoutes);
  await app.register(fastifyFormbody, { parser: qs.parse });
  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  });
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'assets'),
    prefix: '/assets/'
  });
};

const setupLocalization = async () => {
  await i18next
    .init({
      lng: 'en',
      fallbackLng: 'ru',
      resources: {
        en,
      },
    });
};

export default async (app, _options) => {
  await registerPlugins(app);

  await setupLocalization();
  setUpViews(app);
  addRoutes(app);

  return app;
};
