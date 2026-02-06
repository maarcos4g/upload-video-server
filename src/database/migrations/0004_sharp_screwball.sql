ALTER TABLE "memberships" DROP CONSTRAINT "memberships_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;