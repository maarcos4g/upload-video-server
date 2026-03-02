import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const revokeInvitation: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .patch(
      '/invitations/:inviteId/revoke',
      {
        schema: {
          params: z.object({
            inviteId: z.uuid()
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { inviteId } = request.params

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
              eq(schema.invitation.id, inviteId)
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
            .update(schema.invitation)
            .set({
              status: 'revoked',
              updatedAt: new Date()
            })
            .where(
              eq(schema.invitation.id, invitation.id
              )
            )

          return reply.status(204).send(null)
        })

      }
    )
}