import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { bunnyStream } from "@/services/bunny-net";
import { createSlug } from "@/utils/create-slug";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createUploadBatch: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organizations/:slug/:collectionId/batch',
      {
        schema: {
          params: z.object({
            slug: z.string(),
            collectionId: z.uuid()
          }),
          body: z.object({
            titles: z.array(z.string()).min(1).max(10)
          }),
          response: {
            201: z.object({
              batchId: z.uuid(),
              files: z.array(z.object({
                bunnyVideoId: z.string(),
                title: z.string(),
                uploadURL: z.url(),
                uploadId: z.uuid(),
                slug: z.string()
              }))
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug, collectionId } = request.params
        const { titles } = request.body
        const { organization } = await request.getUserMembership(slug)

        const [collection] = await database
          .select()
          .from(schema.collection)
          .where(eq(schema.collection.id, collectionId))

        if (!collection) {
          throw new BadRequestError('Collection not found!')
        }

        const bunnyData = await Promise.all(titles.map(async (title) => {
          const { guid: bunnyVideoId } = await bunnyStream.createVideo(title)

          return {
            bunnyVideoId,
            title,
            slug: createSlug(title)
          }
        }))

        const result = await database.transaction(async (transaction) => {

          const [batch] = await transaction
            .insert(schema.uploadBatch)
            .values({
              organizationId: organization.id,
              collectionId: collection.id,
              status: 'processing',
              totalFiles: titles.length
            })
            .returning()

          const uploads = await transaction
            .insert(schema.upload)
            .values(
              bunnyData.map(video => ({
                externalId: video.bunnyVideoId,
                batchId: batch.id,
                title: video.title,
                authorId: userId,
                slug: video.slug,
                status: 'pending' as 'pending'
              }))
            )
            .returning()

          const files = bunnyData.map((video, index) => ({
            ...video,
            uploadId: uploads[index].id,
            uploadURL: bunnyStream.getUploadURL(video.bunnyVideoId)
          }))

          return { batchId: batch.id, files }

        })
        return reply.status(201).send(result)
      }
    )
}