import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { and, eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const deleteCollection: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .delete(
      '/organizations/:slug/collections/:collectionId',
      {
        schema: {
          tags: ['collections'],
          summary: 'Delete a collection',
          params: z.object({
            slug: z.string(),
            collectionId: z.uuid(),
          }),
          response: {
            204: z.null(),
          },
        }
      },
      async (request, reply) => {
        const { slug, collectionId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const [collection] = await database
          .select()
          .from(schema.collection)
          .where(
            and(
              eq(schema.collection.id, collectionId),
              eq(schema.collection.organizationId, organization.id)
            )
          )

        if (!collection) {
          throw new BadRequestError('Collection not found')
        }

        const isOrganizationAdmin = membership.role === 'admin'
        const isCollectionOwner = collection.ownerId === userId

        const cannotDeleteCollection = !isOrganizationAdmin && !isCollectionOwner

        if (cannotDeleteCollection) {
          throw new UnauthorizedError(
            `You're not allowed to delete this collection.`
          )
        }

        await database
          .delete(schema.collection)
          .where(
            eq(schema.collection.id, collection.id)
          )

        return reply.status(204).send(null)
      }
    )
}