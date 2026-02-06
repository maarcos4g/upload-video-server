import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getMembership: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organization/:slug/membership',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get user membership on organization',
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              membership: z.object({
                id: z.uuid(),
                role: z.string(),
                userId: z.uuid(),
                organizationId: z.uuid(),
              })
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership } = await request.getUserMembership(slug)

        return reply.send({ membership })
      }
    )
}