import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getPlans: FastifyPluginAsyncZod = async (server) => {
  server
    .get(
      '/plans',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get available plans',
          response: {
            200: z.object({
              plans: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  slug: z.string(),
                  storageLimitBytes: z.number(),
                  description: z.string().nullable(),
                  features: z.array(z.string()).nullable(),
                  priceInCents: z.string().nullable()
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const plans = await database
          .select()
          .from(schema.plan)

        return reply.send({ plans })

      }
    )
}