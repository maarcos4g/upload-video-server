import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createAccount: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/users',
      {
        schema: {
          summary: 'Create a new account',
          tags: ['auth'],
          body: z.object({
            name: z.string(),
            email: z.email()
          })
        }
      },
      async (request, reply) => {
        const { name, email } = request.body
        const [_, domain] = email.split('@')

        try {
          await database.transaction(async (transaction) => {
            const [userWithSameEmail] = await transaction
              .select({
                id: schema.user.id
              })
              .from(schema.user)
              .where(
                eq(schema.user.email, email)
              )

            if (userWithSameEmail) {
              throw new Error('User with same email already exists')
            }

            const [autoJoinOrganization] = await transaction
              .select()
              .from(schema.organization)
              .where(
                and(
                  eq(schema.organization.domain, domain),
                  eq(schema.organization.shouldAttachUsersByDomain, true),
                )
              )

            const [user] = await transaction
              .insert(schema.user)
              .values({
                name,
                email
              })
              .returning({
                id: schema.user.id
              })

            if (autoJoinOrganization) {
              await transaction
                .insert(schema.membership)
                .values({
                  userId: user.id,
                  organizationId: autoJoinOrganization.id,
                  role: 'member'
                })
            }

            return reply.status(201).send()
          })
        } catch (error) {
          console.warn(error)
          throw new Error('Internal Server Error')
        }

      }
    )
}