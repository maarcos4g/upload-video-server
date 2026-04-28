import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { stripe } from "@/services/stripe";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const stripeWebhook: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/webhook/stripe',
      {
        config: {
          rawBody: true
        },
        schema: {
          response: {
            204: z.null()
          }
        }
      },
      async (request, reply) => {
        const signature = request.headers['stripe-signature']
        let event

        try {
          event = stripe.webhooks.constructEvent(
            request.rawBody as string,
            signature as string,
            env.STRIPE_WEBHOOK_SECRET
          )
        } catch (error: any) {
          console.error('Webhook signature failed', error.message)
          throw new BadRequestError('Webhook signature failed')
        }

        console.log(`✅ Evento recebido: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          console.log(`🔍 Procurando org com Stripe Customer ID: ${customerId}`)

          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          const priceId = lineItems.data[0].price?.id

          if (priceId) {
            const [planPurchased] = await database
              .select()
              .from(schema.plan)
              .where(eq(schema.plan.stripePriceId, priceId))

            if (planPurchased) {
              const updatedOrg = await database
                .update(schema.organization)
                .set({
                  planId: planPurchased.id,
                  stripeSubscriptionId: subscriptionId,
                  storageLimitBytes: planPurchased.storageLimitBytes
                })
                .where(eq(schema.organization.stripeCostumerId, customerId))
                .returning()

              if (updatedOrg.length > 0) {
                console.log(`🚀 Organização ${updatedOrg[0].slug} atualizada para o plano ${planPurchased.name}! Limite: ${updatedOrg[0].storageLimitBytes}`)
              } else {
                console.error(`❌ ALERTA: Nenhuma organização encontrada com o ID ${customerId}. O update falhou!`)
              }
            }
          }
        }

        if (event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object
          const customerId = subscription.customer as string

          const [hobbyPlan] = await database
            .select()
            .from(schema.plan)
            .where(eq(schema.plan.slug, 'hobby'))

          if (hobbyPlan) {
            await database
              .update(schema.organization)
              .set({
                planId: hobbyPlan.id,
                stripeSubscriptionId: null,
                storageLimitBytes: hobbyPlan.storageLimitBytes
              })
              .where(eq(schema.organization.stripeCostumerId, customerId))

            console.log(`Organização rebaixada para o plano Hobby.`)
          }
        }

        if (event.type === 'customer.subscription.updated') {
          const subscription = event.data.object
          const customerId = subscription.customer as string

          const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null
          
          await database
          .update(schema.organization)
          .set({stripeCancelAt: cancelAt})
          .where(
            eq(schema.organization.stripeCostumerId, customerId)
          )
        }

        return reply.status(204).send(null)
      }
    )
}