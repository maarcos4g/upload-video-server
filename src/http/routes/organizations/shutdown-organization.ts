import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const shutdownOrganization: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Shutdown organization',
          params: z.object({
            slug: z.string()
          })
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'admin') {
          throw new UnauthorizedError(
            `You're not allowed to shutdown this organization`
          )
        }

        await database
          .delete(schema.organization)
          .where(
            eq(schema.organization.id, organization.id)
          )

        return reply.status(204).send()
      }
    )
}