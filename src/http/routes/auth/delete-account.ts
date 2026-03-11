import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const deleteAccount: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .delete(
      '/profile',
      {
        schema: {
          summary: 'Delete user account',
          tags: ['auth'],
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const userOwnedOrganizations = await database
          .select({ id: schema.organization.id })
          .from(schema.organization)
          .where(
            eq(schema.organization.ownerId, userId)
          )

        if (userOwnedOrganizations.length > 0) {
          throw new BadRequestError(
            'You cannot delete your account while you own an organization. Transfer your organizations first.'
          )
        }

        await database.transaction(async (transaction) => {
          await transaction
            .delete(schema.authLinks)
            .where(eq(schema.authLinks.userId, userId))

          await transaction
            .delete(schema.user)
            .where(
              eq(schema.user.id, userId)
            )
        })

        reply.clearCookie('auth', { path: '/' })

        return reply.status(204).send(null)
      }
    )
}