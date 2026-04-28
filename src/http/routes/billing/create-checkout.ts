import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { UnauthorizedError } from "@/http/errors/unauthorized";
import { authenticationMiddleware } from "@/http/middlewares/authentication";
import { stripe } from "@/services/stripe";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createCheckout: FastifyPluginAsyncZod = async (server) => {
  server
    .register(authenticationMiddleware)
    .post(
      '/organizations/:slug/checkout',
      {
        schema: {
          tags: ['billing'],
          summary: 'Create a Stripe Checkout Session',
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            planSlug: z.string(),
          }),
          response: {
            200: z.object({
              checkoutURL: z.url()
            })
          }
        }
      },
      async (request, reply) => {
        const { slug } = request.params
        const { planSlug } = request.body
        const { membership, organization } = await request.getUserMembership(slug)

        if (membership.role !== 'admin') {
          throw new UnauthorizedError(
            `Only admins can upgrade plan`
          )
        }

        const [targetPlan] = await database
          .select()
          .from(schema.plan)
          .where(eq(schema.plan.slug, planSlug))

        if (!targetPlan || !targetPlan.stripePriceId) {
          throw new BadRequestError('Plan not found or unavailable for subscription')
        }

        let stripeCostumerId = organization.stripeCostumerId

        if (!stripeCostumerId) {

          const [organizationOwner] = await database
            .select()
            .from(schema.user)
            .where(
              eq(schema.user.id, organization.ownerId)
            )

          if (!organizationOwner) {
            throw new BadRequestError()
          }

          const custumer = await stripe.customers.create({
            email: organizationOwner.email,
            metadata: {
              organizationId: organization.id
            }
          })

          stripeCostumerId = custumer.id

          await database
            .update(schema.organization)
            .set({
              stripeCostumerId
            })
            .where(eq(schema.organization.id, organization.id))
        }

        const session = await stripe.checkout.sessions.create({
          customer: stripeCostumerId,
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price: targetPlan.stripePriceId,
              quantity: 1
            }
          ],
          success_url: `${env.AUTH_REDIRECT_URL}/org/${slug}/settings?billing=success`,
          cancel_url: `${env.AUTH_REDIRECT_URL}/org/${slug}/settings`,
        })

        return reply.send({ checkoutURL: session.url! })
      }
    )
}