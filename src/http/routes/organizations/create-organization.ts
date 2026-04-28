import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { createSlug } from "@/utils/create-slug";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createOrganization: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organization',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Create a new organization',
          body: z.object({
            name: z.string().min(3, 'O nome da organização precisa conter ao menos 3 caracteres'),
            domain: z.string(),
            shouldAttachUsersByDomain: z.boolean().optional()
          }),
          response: {
            201: z.object({
              organizationSlug: z.string()
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { name, domain, shouldAttachUsersByDomain } = request.body

        if (domain) {
          const [organizationByDomain] = await database
            .select()
            .from(schema.organization)
            .where(
              eq(schema.organization.domain, domain)
            )

          if (organizationByDomain) {
            console.error('Another Organization with same domain already exists')
            throw new BadRequestError('Another Organization with same domain already exists')
          }
        }

        const [hobbyPlan] = await database
          .select({
            id: schema.plan.id,
            storageLimitBytes: schema.plan.storageLimitBytes
          })
          .from(schema.plan)
          .where(
            eq(schema.plan.slug, 'hobby')
          )

        if (!hobbyPlan) {
          throw new BadRequestError('Plano Hobby não configurado no sistema.')
        }

        const result = await database.transaction(async (transaction) => {
          const [organization] = await transaction
            .insert(schema.organization)
            .values({
              name,
              slug: createSlug(name),
              domain,
              shouldAttachUsersByDomain,
              ownerId: userId,
              planId: hobbyPlan.id,
              storageLimitBytes: hobbyPlan.storageLimitBytes
            })
            .returning({
              id: schema.organization.id,
              slug: schema.organization.slug,
            })

          await transaction
            .insert(schema.membership)
            .values({
              organizationId: organization.id,
              role: 'admin',
              userId,
            })

          return { organizationSlug: organization.slug }
        })
        reply.status(201).send(result)
      }
    )
}