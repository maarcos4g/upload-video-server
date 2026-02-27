import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getUpload: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/uploads/:uploadId',
      {
        schema: {
          params: z.object({
            slug: z.string(),
            uploadId: z.uuid()
          }),
          response: {
            200: z.object({
              upload: z.object({
                id: z.uuid(),
                externalId: z.string().nullable(),
                title: z.string(),
                description: z.string().nullable(),
                status: z.string().nullable(),
                streamURL: z.string().nullable(),
                thumbnailURL: z.string().nullable(),
                createdAt: z.date().nullable(),
                transcription: z.string().nullable(),
                audioURL: z.url().nullable()
              })
            })
          }
        }
      },
      async (request, reply) => {
        const { slug, uploadId } = request.params

        const { organization } = await request.getUserMembership(slug)

        const [upload] = await database
          .select({
            id: schema.upload.id,
            externalId: schema.upload.externalId,
            title: schema.upload.title,
            description: schema.upload.description,
            status: schema.upload.status,
            streamURL: schema.upload.streamURL,
            thumbnailURL: schema.upload.thumbnailURL,
            transcription: schema.upload.transcription,
            createdAt: schema.upload.createdAt,
            audioStorageKey: schema.upload.audioStorageKey,
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

        return reply.send({
          upload: {
            audioURL: upload.audioStorageKey ? `${env.CLOUDFLARE_R2_PUBLIC_URL}/${upload.audioStorageKey}` : null,
            ...upload,
          }
        })
      }
    )
}