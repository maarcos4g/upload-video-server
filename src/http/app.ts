import { env } from '@/env'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { errorHandler } from './error-handler'
import { fastifyMultipart } from '@fastify/multipart'
import fastifyRawBody from 'fastify-raw-body'

const server = fastify().withTypeProvider<ZodTypeProvider>()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler(errorHandler)

server.register(fastifyCors, {
  origin: env.AUTH_REDIRECT_URL, //url do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  credentials: true,
})

server.register(fastifyCookie, {
  secret: env.COOKIE_SECRET,
  hook: 'onRequest',
  parseOptions: {},
})

server.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'auth',
    signed: false
  }
})

server.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true
})

server.register(fastifyMultipart)

export { server }