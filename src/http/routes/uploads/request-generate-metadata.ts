import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { bunnyStream } from "@/services/bunny-net";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const requestGenerateMetadata: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organizations/:slug/uploads/:uploadId/generate-metadata',
      {
        schema: {
          params: z.object({
            slug: z.string(),
            uploadId: z.uuid()
          }),
          body: z.object({
            title: z.boolean().default(false),
            description: z.boolean().default(false)
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const { slug, uploadId } = request.params
        const { title, description } = request.body

        const { organization } = await request.getUserMembership(slug)

        const [upload] = await database
          .select()
          .from(schema.upload)
          .innerJoin(
            schema.uploadBatch,
            eq(schema.upload.batchId, schema.uploadBatch.id)
          )
          .where(
            and(
              eq(schema.upload.id, uploadId),
              eq(schema.uploadBatch.organizationId, organization.id),
            )
          )

        if (!upload || !upload.uploads.externalId) {
          throw new BadRequestError('Upload not found or not accessible')
        }

        await bunnyStream.triggerSmartGenerateMetatadas(upload.uploads.externalId, {
          generateTitle: title,
          generateDescription: description
        })

        return reply.status(204).send(null)
      }
    )
}