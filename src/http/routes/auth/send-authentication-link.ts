import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { resend } from "@/services/resend";
import { SendAuthLinkTemplate } from "@/templates/send-authentication-link";
import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";

export const sendAuthenticationLink: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/authenticate',
      {
        schema: {
          summary: 'Send an auth link to user email',
          tags: ['auth'],
          body: z.object({
            email: z.email()
          })
        }
      },
      async (request, reply) => {
        const { email } = request.body

        const [user] = await database
          .select({
            id: schema.user.id,
            email: schema.user.email
          })
          .from(schema.user)
          .where(
            eq(schema.user.email, email)
          )

        if (!user) {
          throw new BadRequestError('User does not exist with this email')
        }

        const authLinkCode = randomUUID()

        await database
          .insert(schema.authLinks)
          .values({
            code: authLinkCode,
            userId: user.id
          })

        const authLink = new URL('/auth-links/authenticate', env.API_BASE_URL)
        authLink.searchParams.set('code', authLinkCode)
        authLink.searchParams.set('redirect', env.AUTH_REDIRECT_URL)

        const { error } = await resend.emails.send({
          from: 'upload.video admin <send@maarcos4g.shop>',
          to: [user.email],
          subject: 'Link de autenticação',
          react: SendAuthLinkTemplate({
            email: user.email,
            authLink: String(authLink)
          })
        })

        if (error) {
          console.error('Error sending authentication email:', error)
          throw new BadRequestError('Failed to send authentication email. Please try again later.')
        }

        return reply.send()
      }
    )
}