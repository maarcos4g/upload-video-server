import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { roleEnum } from "@/database/schemas/roles";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq, not } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getInvitations: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/invitations',
      {
        schema: {
          tags: ['invitations'],
          summary: 'Get all invitations for the current user',
          response: {
            200: z.object({
              invitations: z.array(
                z.object({
                  id: z.uuid(),
                  organization: z.object({
                    id: z.uuid(),
                    name: z.string(),
                    avatarURL: z.url().nullable()
                  }),
                  createdAt: z.date(),
                  role: z.enum(roleEnum.enumValues)
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const [user] = await database
          .select({
            email: schema.user.email,
          })
          .from(schema.user)
          .where(
            eq(schema.user.id, userId)
          )

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const invitations = await database
          .select({
            id: schema.invitation.id,
            createdAt: schema.invitation.createdAt,
            role: schema.invitation.role,
            organization: schema.organization,
          })
          .from(schema.invitation)
          .innerJoin(
            schema.organization,
            eq(schema.organization.id, schema.invitation.organizationId)
          )
          .where(
            and(
              eq(schema.invitation.email, user.email),
              eq(schema.invitation.status, 'pending'),
            )
          )

        return reply.send({ invitations })
      }
    )
}