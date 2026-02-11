import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { invitationEnum } from "@/database/schemas/invitation-status";
import { roleEnum } from "@/database/schemas/roles";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq, isNotNull } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getPendingInvitations: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/invitations',
      {
        schema: {
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              invitations: z.array(
                z.object({
                  id: z.uuid(),
                  email: z.email().nullable(),
                  role: z.enum(roleEnum.enumValues),
                  status: z.enum(invitationEnum.enumValues),
                  token: z.string(),
                  authorId: z.uuid().nullable()
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const [organization] = await database
          .select()
          .from(schema.organization)
          .where(
            eq(schema.organization.slug, slug)
          )

        if (!organization) {
          throw new BadRequestError('Organization not found!')
        }

        const invitations = await database
          .select({
            id: schema.invitation.id,
            email: schema.invitation.email,
            role: schema.invitation.role,
            status: schema.invitation.status,
            token: schema.invitation.token,
            authorId: schema.invitation.authorId
          })
          .from(schema.invitation)
          .where(
            and(
              eq(schema.invitation.organizationId, organization.id),
              eq(schema.invitation.status, 'pending'),
              isNotNull(schema.invitation.email)
            )
          )

        return reply.send({ invitations })
      }
    )
}