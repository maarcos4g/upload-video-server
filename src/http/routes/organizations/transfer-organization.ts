import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const transferOrganization: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .patch(
      '/organizations/:slug/owner',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Transfer organization ownership',
          security: [{ bearerAuth: [] }],
          body: z.object({
            transferToUserEmail: z.email(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(slug)

        const isOrganizationAdmin = membership.role === 'admin'
        const isOrganizationOwner = organization.ownerId === userId

        const canTransferOwnership = isOrganizationAdmin && isOrganizationOwner

        if (!canTransferOwnership) {
          throw new UnauthorizedError(
            `You don't have permission to transfer this organization ownership`
          )
        }

        const { transferToUserEmail } = request.body

        const [userWithEmail] = await database
          .select()
          .from(schema.user)
          .where(
            eq(schema.user.email, transferToUserEmail)
          )

        if (!userWithEmail) {
          throw new BadRequestError(
            'Target user does not exist'
          )
        }

        if (userWithEmail.id === userId) {
          throw new BadRequestError('You are already the owner of this organization.')
        }

        const [transferMembership] = await database
          .select()
          .from(schema.membership)
          .where(
            and(
              eq(schema.membership.organizationId, organization.id),
              eq(schema.membership.userId, userWithEmail.id),
            )
          )

        if (!transferMembership) {
          throw new BadRequestError(
            'Target user must be a member of this organization before transferring ownership.'
          )
        }

        await database.transaction(async (transaction) => {

          await transaction
            .update(schema.membership)
            .set({
              role: 'admin'
            })
            .where(
              and(
                eq(schema.membership.id, transferMembership.id),
              )
            )

          await transaction
            .update(schema.organization)
            .set({
              ownerId: transferMembership.userId
            })
            .where(
              eq(schema.organization.id, organization.id)
            )

            await transaction
            .delete(schema.membership)
            .where(
              eq(schema.membership.id, membership.id)
            )
        })

        return reply.status(204).send(null)
      }
    )
}