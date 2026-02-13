import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq, not } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const updateOrganization: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .put(
      '/organization/:slug',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Update organization details',
          body: z.object({
            name: z.string().nullish(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          params: z.object({
            slug: z.string(),
          })
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(slug)

        const { name, domain, shouldAttachUsersByDomain } = request.body

        if (membership.role !== 'admin' || organization.ownerId !== userId) {
          throw new UnauthorizedError(
            `You're not allowed to update this organization.`,
          )
        }

        if (domain) {
          const [organizationByDomain] = await database
            .select()
            .from(schema.organization)
            .where(
              and(
                eq(schema.organization.domain, domain),
                not(eq(schema.organization.id, organization.id))
              )
            )

          if (organizationByDomain) {
            throw new BadRequestError('Another organization with same domain already exists')
          }
        }

        await database
          .update(schema.organization)
          .set({
            name: name ?? organization.name,
            domain,
            shouldAttachUsersByDomain,
            updatedAt: new Date()
          })
          .where(
            eq(schema.organization.id, organization.id)
          )

        return reply.status(204).send()
      }
    )
}