ALTER TABLE "organizations" ADD COLUMN "stripe_costumer_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripeCostumerId_unique" UNIQUE("stripe_costumer_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripeSubscriptionId_unique" UNIQUE("stripe_subscription_id");