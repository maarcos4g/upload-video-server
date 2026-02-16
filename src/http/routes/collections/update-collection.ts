import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const updateCollection: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .put(
      '/organizations/:slug/collections/:collectionId',
      {
        schema: {
          tags: ['collections'],
          summary: 'Update a collection',
          params: z.object({
            slug: z.string(),
            collectionId: z.uuid()
          }),
          body: z.object({
            name: z.string().nullish(),
            parentId: z.uuid().nullish()
          }),
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const { slug, collectionId } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } = await request.getUserMembership(slug)

        const { name, parentId } = request.body

        if (parentId === collectionId) {
          throw new BadRequestError('A collection cannot be its own parent')
        }

        const [collection] = await database
          .select()
          .from(schema.collection)
          .where(
            eq(schema.collection.id, collectionId)
          )

        if (!collection) {
          throw new BadRequestError('Collection not found.')
        }

        const isOrganizationAdmin = membership.role === 'admin'
        const isCollectionOwner = collection.ownerId === userId

        const cannotUpdateCollection = !isOrganizationAdmin && !isCollectionOwner

        if (cannotUpdateCollection) {
          throw new UnauthorizedError(
            `You're not allowed to update this collection.`
          )
        }

        if (parentId) {
          const [parentCollection] = await database
            .select()
            .from(schema.collection)
            .where(
              eq(schema.collection.id, parentId)
            )

          if (!parentCollection) {
            throw new BadRequestError('Parent Collection not found')
          }

          if (parentCollection.organizationId !== organization.id) {
            throw new BadRequestError('Parent collection must belong to the same organization')
          }
        }

        await database
          .update(schema.collection)
          .set({
            name: name ?? collection.name,
            parentId: parentId === undefined ? collection.parentId : parentId,
            updatedAt: new Date()
          })
          .where(
            eq(schema.collection.id, collectionId)
          )

        return reply.status(204).send(null)
      }
    )
}