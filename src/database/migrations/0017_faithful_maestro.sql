CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"storage_limit_bytes" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug"),
	CONSTRAINT "plans_stripeProductId_unique" UNIQUE("stripe_product_id"),
	CONSTRAINT "plans_stripePriceId_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;