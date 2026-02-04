import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const signOut: FastifyPluginAsyncZod = async (server) => {
  server
  .register(authenticationMiddleware)
    .post(
      '/sign-out',
      {
        schema: {
          summary: 'Sign out user',
          tags: ['auth']
        }
      },
      async (request, reply) => {
        await request.signOut()

        return reply.status(200).send()
      }
    )
}