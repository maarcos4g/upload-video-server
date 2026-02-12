import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { roleEnum } from "@/database/schemas/roles";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getMemberships: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/memberships',
      {
        schema: {
          tags: ['memberships'],
          summary: 'Get organization memberships',
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              memberships: z.array(
                z.object({
                  id: z.uuid(),
                  role: z.enum(roleEnum.enumValues),
                  user: z.object({
                    id: z.uuid(),
                    name: z.string(),
                    email: z.email(),
                    avatarURL: z.url().nullable(),
                  })
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMembership(slug)

        const memberships = await database
          .select({
            id: schema.membership.id,
            role: schema.membership.role,
            user: {
              id: schema.user.id,
              name: schema.user.name,
              email: schema.user.email,
              avatarURL: schema.user.avatarURL,
            }
          })
          .from(schema.membership)
          .innerJoin(
            schema.user,
            eq(schema.user.id, schema.membership.userId)
          )
          .where(
            eq(schema.membership.organizationId, organization.id)
          )

        return reply.send({ memberships })
      }
    )
}