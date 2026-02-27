import { pgEnum } from "drizzle-orm/pg-core";

export const actionTypeEnum = pgEnum('action_types',
  [
    'process_video',
    'generate_ai_metadata',
    'generate_transcription',
    'upload_audio_to_external_provider',
  ])