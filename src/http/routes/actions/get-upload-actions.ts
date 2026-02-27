import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getUploadActions: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/uploads/:uploadId/actions',
      {
        schema: {
          params: z.object({
            slug: z.string(),
            uploadId: z.uuid()
          })
        }
      },
      async (request, reply) => {
        const { slug, uploadId } = request.params
        const { organization } = await request.getUserMembership(slug)

        const [upload] = await database
          .select()
          .from(schema.upload)
          .where(eq(schema.upload.id, uploadId))

        if (!upload) throw new BadRequestError('Upload not found')

        const actions = await database
          .select()
          .from(schema.action)
          .where(
            eq(schema.action.uploadId, uploadId)
          )

        return reply.send({ actions })
      }
    )
}