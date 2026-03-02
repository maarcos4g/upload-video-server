import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const signOut: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/sign-out',
      {
        schema: {
          summary: 'Sign out user',
          tags: ['auth']
        }
      },
      async (_request, reply) => {
        reply.clearCookie('auth', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        })

        return reply.status(200).send()
      }
    )
}