import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const authenticateWithMagicLink: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/auth-links/authenticate',
      {
        schema: {
          summary: 'Authenticate user with magic link',
          tags: ['auth'],
          querystring: z.object({
            code: z.uuid(),
            redirect: z.url()
          })
        }
      },
      async (request, reply) => {
        const { code, redirect } = request.query

        const [authLink] = await database
          .select({
            createdAt: schema.authLinks.createdAt,
            code: schema.authLinks.code,
            userId: schema.authLinks.userId
          })
          .from(schema.authLinks)
          .where(
            eq(schema.authLinks.code, code)
          )

        if (!authLink) {
          throw new BadRequestError('Auth Link does not exist or is invalid')
        }

        if (dayjs().diff(authLink.createdAt, 'days') > 7) {
          throw new BadRequestError('Auth Link has expired')
        }
        
        await request.signUser({
          sub: authLink.userId,
        })

        await database
          .delete(schema.authLinks)
          .where(eq(schema.authLinks.code, code))

        return reply.redirect(redirect, 301)

      }
    )
}