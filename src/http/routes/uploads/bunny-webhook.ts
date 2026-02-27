import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { startBackgroundProcessing } from "@/services/action-processor";
import { bunnyNetConfig, bunnyStream } from "@/services/bunny-net";
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
        if (Status === 5) {
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
                streamURL: `https://${bunnyNetConfig.stream.pullZone}/${upload.externalId}/playlist.m3u8`,
                thumbnailURL: `https://${bunnyNetConfig.stream.pullZone}/${upload.externalId}/${videoDetails.thumbnailFileName}`
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

          setImmediate(() => startBackgroundProcessing(upload.id));
        }

        //title and description generated
        if (Status === 10) {
          const [upload] = await database
            .select()
            .from(schema.upload)
            .where(eq(schema.upload.externalId, VideoGuid))

          if (!upload) {
            throw new BadRequestError('Upload not found')
          }

          const videoDetails = await bunnyStream.getVideoDetails(VideoGuid)

          if (!videoDetails) {
            throw new BadRequestError('Could not fetch video details from Bunny')
          }

          await database
            .update(schema.upload)
            .set({
              title: videoDetails.title,
              description: videoDetails.description,
              slug: createSlug(videoDetails.title),
            })
            .where(
              eq(schema.upload.externalId, VideoGuid)
            )

          setImmediate(() => startBackgroundProcessing(upload.id));
        }

        return reply.send()
      }
    )
}