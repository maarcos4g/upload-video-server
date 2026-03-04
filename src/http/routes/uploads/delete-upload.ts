import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { bunnyStream } from "@/services/bunny-net";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const deleteUpload: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .delete(
      '/organizations/:slug/uploads/:uploadId',
      {
        schema: {
          params: z.object({
            slug: z.string(),
            uploadId: z.uuid()
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const { slug, uploadId } = request.params

        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        await database.transaction(async (transaction) => {
          const [upload] = await transaction
            .select({
              id: schema.upload.id,
              authorId: schema.upload.authorId,
              externalId: schema.upload.externalId
            })
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

          if (!upload) {
            throw new BadRequestError('Upload not found or does not belong to this organization')
          }

          const isAdminOrOwner = membership?.role === 'admin' || upload.authorId === userId

          if (!isAdminOrOwner) {
            throw new UnauthorizedError(
              `You do not have permission to delete this upload.`
            )
          }

          if (upload.externalId) {
            try {
              await bunnyStream.deleteVideo(upload.externalId)
            } catch (error) {
              console.error('Error deleting video from Bunny:', error)
              throw new BadRequestError('Failed to delete video. Please try again later.')
            }
          }

          await transaction
            .delete(schema.upload)
            .where(
              eq(schema.upload.id, upload.id)
            )

          return reply.status(204).send(null)
        })
      }
    )
}