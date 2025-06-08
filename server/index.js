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
import addRoutes from './routes/index.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

const mode = process.env.NODE_ENV || 'development';

const setUpViews = (app) => {
  app.register(fastifyView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      assetPath: (filename) => `/assets/${filename}`,
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
};

export default async (app, _options) => {
  await registerPlugins(app);

  setUpViews(app);
  addRoutes(app);

  return app;
};
