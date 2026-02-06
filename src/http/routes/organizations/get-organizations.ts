import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getOrganizations: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get Organizations where user is a member',
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  avatarURL: z.url().nullable(),
                  slug: z.string(),
                  role: z.literal(['admin', 'member', 'viewer'])
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const organizations = await database
          .select({
            id: schema.organization.id,
            name: schema.organization.name,
            avatarURL: schema.organization.avatarURL,
            slug: schema.organization.slug,
            role: schema.membership.role,
          })
          .from(schema.organization)
          .innerJoin(
            schema.membership,
            eq(schema.membership.organizationId, schema.organization.id)
          )
          .where(
            eq(schema.membership.userId, userId)
          )

        return reply.send({ organizations })

      }
    )
}