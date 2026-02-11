import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const acceptInvitation: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/invite/:token',
      {
        schema: {
          params: z.object({
            token: z.string()
          })
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { token } = request.params

        return database.transaction(async (transaction) => {
          const [result] = await transaction
            .select({
              invitation: schema.invitation,
              organization: schema.organization
            })
            .from(schema.invitation)
            .innerJoin(
              schema.organization,
              eq(schema.organization.id, schema.invitation.organizationId)
            )
            .where(
              eq(schema.invitation.token, token)
            )

          if (!result) {
            throw new BadRequestError('Invitation not found')
          }

          const { invitation, organization } = result

          if (invitation.status !== 'pending') {
            throw new BadRequestError('This invitation has already been used or revoked')
          }

          if (invitation.authorId === userId) {
            throw new BadRequestError(`You can't accept your own invitation`)
          }

          const [user] = await transaction
            .select()
            .from(schema.user)
            .where(
              eq(schema.user.id, userId)
            )

          if (invitation.email && invitation.email !== user.email) {
            throw new BadRequestError('This invitation was sent to another email address')
          }


          await transaction
            .insert(schema.membership)
            .values({
              organizationId: organization.id,
              userId: userId,
              role: invitation.role,
            })
            .onConflictDoNothing()

          await transaction
            .update(schema.invitation)
            .set({
              status: 'accepted',
              updatedAt: new Date()
            })
            .where(
              eq(schema.invitation.id, invitation.id
              )
            )

          return reply.redirect(`${env.AUTH_REDIRECT_URL}/org/${organization.slug}`, 301)
        })

      }
    )
}