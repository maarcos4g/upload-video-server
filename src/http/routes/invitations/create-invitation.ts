import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { roleEnum } from "@/database/schemas/roles";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq, exists } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { randomBytes } from "node:crypto";
import { z } from "zod/v4";

export const createInvitation: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/invite',
      {
        schema: {
          tags: ['invitations'],
          summary: 'Create a new invitation',
          body: z.object({
            email: z.email().nullable().optional(),
            slug: z.string(),
            role: z.enum(roleEnum.enumValues).nullable().optional()
          }),
          response: {
            201: z.object({
              invitationId: z.uuid(),
            })
          }
        }
      },
      async (request, reply) => {
        const { email, slug, role } = request.body

        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'admin') {
          throw new UnauthorizedError(`You're not allowed to send invitations`)
        }

        if (email) {
          const [userAlreadyMember] = await database
          .select()
          .from(schema.membership)
          .where(
            and(
              eq(schema.membership.organizationId, organization.id),
              exists(database
                .select()
                .from(schema.user)
                .where(
                  and(
                    eq(schema.user.id, schema.membership.userId),
                    eq(schema.user.email, email)
                  )
                )
              )
            )
          )

          if (userAlreadyMember) {
            throw new BadRequestError('User is already a member of this organzation')
          }
        }

        const token = randomBytes(20).toString('hex')

        const [invitation] = await database
          .insert(schema.invitation)
          .values({
            organizationId: organization.id,
            email: email ?? null,
            role: role ?? 'member',
            token,
            authorId: userId
          })
          .returning({
            id: schema.invitation.id
          })

        const invitationURL = new URL(`/invite/${token}`, env.API_BASE_URL)
        console.log(invitationURL.href)

        //send email with invitation link

        return reply.status(201).send({ invitationId: invitation.id })
      }
    )
}