import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getOrganization: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get details from organization',
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              organization: z.object({
                id: z.uuid(),
                name: z.string(),
                avatarURL: z.url().nullable(),
                slug: z.string(),
                domain: z.string(),
                shouldAttachUsersByDomain: z.boolean(),
                createdAt: z.date(),
                ownerId: z.uuid(),
              })
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMembership(slug)

        return reply.send({ organization })
      }
    )
}