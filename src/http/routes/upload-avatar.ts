import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { authenticationMiddleware } from "../middlewares/authentication";
import { randomUUID } from "node:crypto";
import { cloudflareR2 } from "@/services/cloudflare-r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";
import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "../errors/bad-request-error";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

interface Metadata {
  organization_slug?: string | null | undefined
  user_id?: string | null | undefined
  [key: string]: any
}

export const uploadAvatar: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/upload',
      {
        schema: {
          response: {
            201: z.object({
              fileKey: z.uuid()
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        let fileName = ''
        let fileMimeType = ''
        let fileBuffer: Buffer | null = null
        const metadata: Metadata = {
          author_id: userId,
        }

        const parts = request.parts()

        for await (const part of parts) {
          if (part.type === 'file') {

            fileBuffer = await part.toBuffer()
            fileMimeType = part.mimetype

            const fileId = randomUUID()
            const extension = part.filename.split('.').pop()
            fileName = `${fileId}.${extension}`
          } else {
            metadata[part.fieldname] = part.value as string
          }
        }

        if (!fileBuffer || !fileName) {
          throw new BadRequestError('Arquivo não enviado.')
        }

        if (fileBuffer && fileName) {
          await cloudflareR2.send(
            new PutObjectCommand({
              Bucket: env.CLOUDFLARE_BUCKET_NAME,
              Key: fileName,
              Body: fileBuffer,
              ContentType: fileMimeType,
              Metadata: metadata
            })
          )

          const avatarURL = `${env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`

          try {
            if (metadata.organization_slug) {
              await database.update(schema.organization)
                .set({ avatarURL, updatedAt: new Date() })
                .where(
                  eq(schema.organization.slug, metadata.organization_slug)
                )
            } else {
              const targetId = metadata.user_id || userId

              await database.update(schema.user)
                .set({ avatarURL, updatedAt: new Date() })
                .where(
                  eq(schema.user.id, targetId)
                )
            }
          } catch (error) {
            console.error(error)
            throw error
          }
        }

        const [fileKey, _] = fileName.split('.')

        return reply.status(201).send({ fileKey })
      }
    )

}