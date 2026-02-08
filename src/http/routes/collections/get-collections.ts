import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { makeCollectionsTree } from "@/utils/make-collections-tree";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const getCollections: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .get(
      '/organizations/:slug/collections',
      {
        schema: {
          tags: ['collections'],
          summary: 'Get all organization collections',
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              collections: z.array(
                z.object({
                  id: z.uuid(),
                  name: z.string(),
                  parentId: z.uuid().nullable(),
                  createdAt: z.coerce.date(),
                  ownerId: z.uuid(),
                  children: z.array(z.any())
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params

        const { organization } = await request.getUserMembership(slug)

        const allCollections = await database
          .select()
          .from(schema.collection)
          .where(
            eq(schema.collection.organizationId, organization.id)
          )

        const collectionsTree = makeCollectionsTree(allCollections)

        return reply.send({ collections: collectionsTree })
      }
    )
}