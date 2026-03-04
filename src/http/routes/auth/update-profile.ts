import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const updateProfile: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .put(
      '/profile',
      {
        schema: {
          summary: 'Update user profile',
          tags: ['auth'],
          body: z.object({
            name: z.string(),
            email: z.email()
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { name, email } = request.body

        const [user] = await database
          .select()
          .from(schema.user)
          .where(
            and(
              eq(schema.user.id, userId),
            )
          )

        if (!user) {
          throw new UnauthorizedError('Usuário não encontrado.')
        }

        if (email !== user.email) {
          const [userWithSameEmail] = await database
            .select()
            .from(schema.user)
            .where(
              and(
                eq(schema.user.email, email),
              )
            )

          if (userWithSameEmail) {
            throw new BadRequestError('This email has been used by another account')
          }
        }

        await database
          .update(schema.user)
          .set({
            email: email,
            name: name,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(schema.user.id, userId),
            )
          )

        return reply.status(204).send(null)
      }
    )
}