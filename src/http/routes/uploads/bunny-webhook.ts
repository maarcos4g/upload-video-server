import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { bunnyStream } from "@/services/bunny-net";
import { createSlug } from "@/utils/create-slug";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const bunnyWebhook: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/webhook/bunny',
      {
        schema: {
          body: z.object({
            VideoLibraryId: z.number(),
            VideoGuid: z.uuid(),
            Status: z.number()
          })
        }
      },
      async (request, reply) => {

        const { VideoLibraryId, VideoGuid, Status } = request.body

        //status 1 -> queued
        if (Status === 1) {

          const [upload] = await database
            .select()
            .from(schema.upload)
            .where(eq(schema.upload.externalId, VideoGuid))

          if (!upload) {
            throw new BadRequestError('Upload not found')
          }

          await database
            .update(schema.upload)
            .set({
              status: 'uploading'
            })
            .where(
              eq(schema.upload.externalId, VideoGuid)
            )
        }

        //status 2 -> processing
        if (Status === 2) {
          const [upload] = await database
            .select()
            .from(schema.upload)
            .where(eq(schema.upload.externalId, VideoGuid))

          if (!upload) {
            throw new BadRequestError('Upload not found')
          }

          await database
            .update(schema.upload)
            .set({
              status: 'processing'
            })
            .where(
              eq(schema.upload.externalId, VideoGuid)
            )
        }

        //status 4 -> error
        if (Status === 4) {
          const [upload] = await database
            .select()
            .from(schema.upload)
            .where(eq(schema.upload.externalId, VideoGuid))

          if (!upload) {
            throw new BadRequestError('Upload not found')
          }

          await database.transaction(async (transaction) => {
            await transaction
              .update(schema.upload)
              .set({
                status: 'cancelled'
              })
              .where(
                eq(schema.upload.externalId, VideoGuid)
              )

            await transaction
              .update(schema.uploadBatch)
              .set({
                status: 'failed',
              })
              .where(eq(schema.uploadBatch.id, upload.batchId!))
          })
        }

        //status 3 -> finished
        if (Status === 3) {
          const [upload] = await database
            .select()
            .from(schema.upload)
            .where(eq(schema.upload.externalId, VideoGuid))

          if (!upload) {
            throw new BadRequestError('Upload not found')
          }

          try {
            await bunnyStream.triggerSmartGenerateMetatadas(VideoGuid)
            await new Promise((resolve) => setTimeout(resolve, 15000))
          } catch (e) {
            console.error("IA falhou, mas seguindo com o processamento...")
          }


          const videoDetails = await bunnyStream.getVideoDetails(VideoGuid)

          if (!videoDetails) {
            throw new BadRequestError('Could not fetch video details from Bunny')
          }

          await database.transaction(async (transaction) => {
            const [updatedUpload] = await transaction
              .update(schema.upload)
              .set({
                status: 'completed',
                title: videoDetails.title,
                description: videoDetails.description,
                slug: createSlug(videoDetails.title),
                duration: videoDetails.length,
                sizeInBytes: videoDetails.storageSize,
                processedAt: new Date(),
                streamURL: `https://iframe.mediadelivery.net/play/${VideoLibraryId}/${upload.externalId}`,
                thumbnailURL: `https://${env.BUNNY_NET_PULL_ZONE}/${upload.externalId}/${videoDetails.thumbnailFileName}`
              })
              .where(
                eq(schema.upload.externalId, VideoGuid)
              )
              .returning()

            if (updatedUpload.batchId) {
              const batchUploads = await transaction
                .select()
                .from(schema.upload)
                .where(eq(schema.upload.batchId, updatedUpload.batchId))

              const allCompleted = batchUploads.every(upload => upload.status === 'completed' || upload.status === 'cancelled')

              if (allCompleted) {
                await transaction
                  .update(schema.uploadBatch)
                  .set({
                    status: 'completed',
                  })
                  .where(eq(schema.uploadBatch.id, updatedUpload.batchId))
              }
            }
          })
        }

        return reply.send()
      }
    )
}