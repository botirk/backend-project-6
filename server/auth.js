import { Strategy } from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session'
import fastifyPassport from '@fastify/passport'
import { timingSafeEqual, createHash } from 'node:crypto'

export const encrypt = (value) => createHash('sha256').update(value).digest('hex')

class FormStrategy extends Strategy {
  constructor(name, app) {
    super(name)
    this.app = app
  }

  compare(passwordHash1, password2) {
    return timingSafeEqual(Buffer.from(passwordHash1), Buffer.from(encrypt(password2)))
  }

  async authenticate(req) {
    if (req.isAuthenticated()) return this.pass()
    const email = req?.body?.data?.email
    const password = req?.body?.data?.password
    if (!email || !password) return this.fail()
    const user = await this.app.models.user.query().findOne({ email })
    if (user && this.compare(user.password, password)) return this.success(user)
    return this.fail()
  }
}

export default async (app) => {
  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  })
  fastifyPassport.registerUserDeserializer(user => app.models.user.query().findById(user.id))
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user))
  fastifyPassport.use(new FormStrategy('form', app))
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())
  app.decorate('passport', fastifyPassport)
}