import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createCollection: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organizations/:slug/collections',
      {
        schema: {
          tags: ['collections'],
          summary: 'Create a new organization collection',
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string().min(1, 'O nome da coleção precisa conter ao menos 1 caractere.'),
            parentId: z.uuid().nullable().optional(),
          }),
          response: {
            201: z.object({
              collectionId: z.uuid()
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { slug } = request.params
        const { name, parentId } = request.body

        const { organization } = await request.getUserMembership(slug)

        if (parentId) {
          const [parentCollection] = await database
            .select({
              id: schema.collection.id
            })
            .from(schema.collection)
            .where(
              and(
                eq(schema.collection.id, parentId),
                eq(schema.collection.organizationId, organization.id)
              )
            )

            if (!parentCollection) {
              throw new BadRequestError('A coleção pai não existe ou pertence a outra organização')
            }
        }

        const [collection] = await database
          .insert(schema.collection)
          .values({
            name,
            parentId,
            organizationId: organization.id,
            ownerId: userId
          })
          .returning({
            id: schema.collection.id
          })

        return reply.status(201).send({ collectionId: collection.id })
      }
    )
}