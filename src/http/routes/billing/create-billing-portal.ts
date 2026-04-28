import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { stripe } from "@/services/stripe";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createPortal: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organizations/:slug/billing-portal',
      {
        schema: {
          tags: ['billing'],
          summary: 'Create a Stripe Customer Portal Session',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              portalURL: z.url()
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params
        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'admin') {
          throw new UnauthorizedError(`Only admins can manage billing informations`)
        }

        let stripeCustomerId = organization.stripeCostumerId

        if (!stripeCustomerId) {
          throw new BadRequestError('This organization does not have billing history')
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${env.AUTH_REDIRECT_URL}/org/${slug}/settings`
        })

        return reply.send({ portalURL: portalSession.url })
      }
    )
}