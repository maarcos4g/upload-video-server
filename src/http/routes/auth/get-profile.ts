import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getProfile: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/profile',
      {
        schema: {
          summary: 'Get user profile',
          tags: ['auth'],
          response: {
            201: z.object({
              user: schema.user
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const [user] = await database
          .select({
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            avatarURL: schema.user.avatarURL
          })
          .from(schema.user)
          .where(
            eq(schema.user.id, userId)
          )

        if (!user) {
          throw new Error('User not found')
        }

        return reply.send({
          user
        })
      }
    )
}