import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { collection } from "@/database/schemas/collection";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { bunnyStream } from "@/services/bunny-net";
import { eq, name } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const updateUpload: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .put(
      '/organizations/:slug/uploads/:uploadId',
      {
        schema: {
          tags: ['uploads'],
          summary: 'Update an upload',
          params: z.object({
            slug: z.string(),
            uploadId: z.uuid()
          }),
          body: z.object({
            title: z.string().nullish(),
            description: z.string().nullish()
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const { slug, uploadId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(slug)

        const { title, description } = request.body

        const [upload] = await database
          .select({
            id: schema.upload.id,
            title: schema.upload.title,
            description: schema.upload.description,
            authorId: schema.upload.authorId,
            externalId: schema.upload.externalId
          })
          .from(schema.upload)
          .where(
            eq(schema.upload.id, uploadId)
          )

        if (!upload) {
          throw new BadRequestError('Video not found.')
        }

        const isOrganizationAdmin = membership.role === 'admin'
        const isUploadOwner = upload.authorId === userId

        const cannotUpdateUpload = !isOrganizationAdmin && !isUploadOwner

        if (cannotUpdateUpload) {
          throw new UnauthorizedError(
            `You don't have permission to update this video.`
          )
        }

        await database.transaction(async (transaction) => {
          await transaction
            .update(schema.upload)
            .set({
              title: title ?? upload.title,
              description: description ?? upload.description,
            })
            .where(
              eq(schema.upload.id, uploadId)
            )

          if (upload.externalId) {
            try {
              await bunnyStream.updateVideo(upload.externalId, {
                title: title ?? upload.title,
                description: description ?? upload.description,
              })
            } catch (error) {
              console.error('Error updating video in Bunny:', error)
              throw new BadRequestError('Failed to syncronize with video provider. No changes were saved.')
            }
          }
        })

        return reply.status(204).send(null)
      }
    )
}