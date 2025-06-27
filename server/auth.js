import { createHash } from 'node:crypto';
import fastifyPassport, { Strategy } from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';

export const encryptPassword = (password) => createHash('sha256').update(password).digest('hex');

class FormStrategy extends Strategy {
  constructor(name, app) {
    super(name);
    this.app = app;
  }

  async authenticate(req) {
    if (req.isAuthenticated()) return this.pass();
    const email = req?.body?.data?.email;
    let password = req?.body?.data?.password;
    if (!email || !password) return this.fail();
    password = encryptPassword(password);
    const user = await this.app.models.user.query().findOne({ email, password });
    if (user) return this.success(user);
    return this.fail();
  }
}

export default async (app) => {
  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  });
  fastifyPassport.registerUserDeserializer((user) => app.models.user.query().findById(user.id));
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
  fastifyPassport.use(new FormStrategy('form', app));
  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());
  app.decorate('passport', fastifyPassport);
};
