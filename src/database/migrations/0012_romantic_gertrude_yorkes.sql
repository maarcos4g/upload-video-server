ALTER TABLE "actions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."action_types";--> statement-breakpoint
CREATE TYPE "public"."action_types" AS ENUM('process_video', 'generate_ai_metadata', 'generate_transcription', 'upload_audio_to_external_provider');--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "type" SET DATA TYPE "public"."action_types" USING "type"::"public"."action_types";