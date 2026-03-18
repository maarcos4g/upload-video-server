import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { sum } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getOrganizationUsage: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organization/:slug/usage',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get organization usage',
          params: z.object({
            slug: z.string()
          }),
          response: {
            200: z.object({
              storageUsedBytes: z.number(),
              storageLimitBytes: z.number()
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMembership(slug)

        const [usage] = await database
          .select({
            totalBytes: sum(schema.upload.sizeInBytes).mapWith(Number)
          })
          .from(schema.upload)
          .innerJoin(
            schema.uploadBatch,
            eq(schema.upload.batchId, schema.uploadBatch.id)
          )
          .where(eq(schema.uploadBatch.organizationId, organization.id))

        const storageUsedBytes = usage.totalBytes || 0

        const LIMIT_10_GB = 10 * 1024 * 1024 * 1024

        return reply.send({
          storageUsedBytes,
          storageLimitBytes: LIMIT_10_GB
        })
      }
    )
}