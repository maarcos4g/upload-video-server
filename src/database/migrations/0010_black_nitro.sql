CREATE TYPE "public"."action_status" AS ENUM('pending', 'processing', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."action_types" AS ENUM('process_video', 'generate_ai_metadata', 'generate_transcription', 'upload_to_external_provider');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" uuid NOT NULL,
	"type" "action_types" NOT NULL,
	"status" "action_status" DEFAULT 'pending',
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE cascade ON UPDATE no action;