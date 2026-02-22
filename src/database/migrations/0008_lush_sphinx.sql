CREATE TYPE "public"."upload_status" AS ENUM('pending', 'processing', 'uploading', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "upload_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"collection_id" uuid,
	"total_files" integer DEFAULT 0,
	"status" text DEFAULT 'processing',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"duration" integer,
	"size_in_bytes" integer,
	"status" "upload_status" DEFAULT 'pending',
	"author_id" uuid,
	"batch_id" uuid,
	"stream_url" text,
	"thumbnail_url" text,
	"audio_storage_key" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"processed_at" timestamp,
	CONSTRAINT "uploads_externalId_unique" UNIQUE("external_id"),
	CONSTRAINT "uploads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "upload_batch" ADD CONSTRAINT "upload_batch_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batch" ADD CONSTRAINT "upload_batch_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_batch_id_upload_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."upload_batch"("id") ON DELETE cascade ON UPDATE cascade;