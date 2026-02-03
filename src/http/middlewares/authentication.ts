import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { and, eq } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

export const authenticationMiddleware = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch (error) {
        throw new Error('Invalid token')
      }
    },

      request.getUserMembership = async (organizationId: string) => {
        const userId = await request.getCurrentUserId()

        const [member] = await database
          .select()
          .from(schema.membership)
          .where(
            and(
              eq(schema.membership.userId, userId),
              eq(schema.membership.organizationId, organizationId)
            )
          )
          .innerJoin(
            schema.organization,
            eq(schema.organization.id, schema.membership.organizationId)
          )

        if (!member) {
          throw new Error(`You're not a member of this organization`)
        }

        const { organizations: organization, memberships: membership } = member

        return { organization, membership }
      },

      request.signUser = async (payload: {
        sub: string
      }) => {
        reply.setCookie(
          'auth', 
          await reply.jwtSign(payload, {
            sign: {
              expiresIn: '7 days'
            }
          }), 
          {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60, //7 days
          path: '/'
        })
      },
      request.signOut = async () => {
        await reply.clearCookie('auth')
      }
  })
})