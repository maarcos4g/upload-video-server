import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { uploadStatusEnum } from "@/database/schemas/upload-status";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getUploads: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/uploads',
      {
        schema: {
          params: z.object({
            slug: z.string(),
          }),
          querystring: z.object({
            collectionId: z.uuid().optional()
          }),
          response: {
            200: z.object({
              uploads: z.array(
                z.object({
                  id: z.uuid(),
                  externalId: z.uuid().nullable(),
                  title: z.string(),
                  slug: z.string(),
                  duration: z.number().nullable(),
                  sizeInBytes: z.number().nullable(),
                  status: z.enum(uploadStatusEnum.enumValues).nullable(),
                  batchId: z.uuid().nullable(),
                  thumbnailURL: z.url().nullable(),
                  createdAt: z.date().nullable(),
                  author: z.object({
                    id: z.uuid(),
                    name: z.string(),
                    avatarURL: z.url().nullable(),
                  }).nullable()
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params
        const { collectionId } = request.query

        const { organization } = await request.getUserMembership(slug)

        const results = await database
          .select({
            id: schema.upload.id,
            externalId: schema.upload.externalId,
            title: schema.upload.title,
            slug: schema.upload.slug,
            duration: schema.upload.duration,
            sizeInBytes: schema.upload.sizeInBytes,
            status: schema.upload.status,
            batchId: schema.upload.batchId,
            thumbnailURL: schema.upload.thumbnailURL,
            createdAt: schema.upload.createdAt,
            author: {
              id: schema.user.id,
              name: schema.user.name,
              avatarURL: schema.user.avatarURL,
            }
          })
          .from(schema.upload)
          .innerJoin(
            schema.uploadBatch,
            eq(schema.upload.batchId, schema.uploadBatch.id)
          )
          .leftJoin(
            schema.user,
            eq(schema.upload.authorId, schema.user.id)
          )
          .where(
            and(
              eq(schema.uploadBatch.organizationId, organization.id),
              collectionId
                ? eq(schema.uploadBatch.collectionId, collectionId)
                : undefined
            )
          )

        return reply.send({ uploads: results })

      }
    )
}