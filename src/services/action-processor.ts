import { database } from "@/database/connection";
import { schema } from "@/database/schemas";
import { and, eq } from "drizzle-orm";
import { bunnyNetConfig, bunnyStream } from "./bunny-net";
import { BadRequestError } from "@/http/errors/bad-request-error";
import { PassThrough } from "node:stream";
import axios from "axios";
import { cloudflareR2 } from "./cloudflare-r2";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "@/env";
import ffmpeg from "fluent-ffmpeg"
import { path as ffmpegPathSystem } from "@ffmpeg-installer/ffmpeg";
import path from "node:path"

const absoluteFfmpegPath = ffmpegPathSystem ? path.resolve(ffmpegPathSystem) : null

if (absoluteFfmpegPath) {
  ffmpeg.setFfmpegPath(absoluteFfmpegPath);
}

export async function startBackgroundProcessing(uploadId: string) {
  const pendingActions = await database
    .select()
    .from(schema.action)
    .where(
      and(
        eq(schema.action.uploadId, uploadId),
        eq(schema.action.status, 'pending')
      )
    )
    .orderBy(schema.action.createdAt)

  const [upload] = await database
    .select()
    .from(schema.upload)
    .where(eq(schema.upload.id, uploadId))

  if (!upload) throw new BadRequestError('Upload not found for generate AI metadatas')

  for (const action of pendingActions) {
    await database
      .update(schema.action)
      .set({
        status: 'processing',
      })
      .where(eq(
        schema.action.id, action.id
      ))

    try {
      switch (action.type) {
        case 'generate_ai_metadata':
          await bunnyStream.triggerSmartGenerateMetatadas(upload.externalId!, {
            generateDescription: true,
            generateTitle: true,
          })
          await new Promise(resolve => setTimeout(resolve, 15000));
          break;
        case 'generate_transcription':
          const transcription = await bunnyStream.fetchTranscriptionFromBunny(upload.externalId!)

          await database
            .update(schema.upload)
            .set({
              transcription
            })
            .where(
              eq(schema.upload.id, action.uploadId)
            )
          break;
        case 'upload_audio_to_external_provider':
          const videoURL = `https://${bunnyNetConfig.stream.pullZone}/${upload.externalId}/play_480p.mp4`
          const audioKey = `${upload.id}_audio.mp3`

          const audioStream = new PassThrough()

          const response = await axios({
            method: 'GET',
            url: videoURL,
            responseType: 'stream',
            headers: {
              'User-Agent': 'Mozilla/5.0 (upload-video-background-worker)',
              'AccessKey': env.BUNNY_API_KEY
            }
          })

          console.log('Bunny API response status:', response.status)
          console.log(response)

          ffmpeg(response.data)
            .noVideo()
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (error) => {
              console.error('Erro no FFmpeg: ', error)
              audioStream.destroy(error)
            })
            .pipe(audioStream)

          const parallelUpload = new Upload({
            client: cloudflareR2,
            params: {
              Bucket: env.CLOUDFLARE_BUCKET_NAME,
              Key: audioKey,
              Body: audioStream,
              ContentType: 'audio/mpeg'
            },
            queueSize: 4,
            partSize: 1024 * 1024 * 5,
            leavePartsOnError: false
          })

          await parallelUpload.done()

          await database
            .update(schema.upload)
            .set({
              audioStorageKey: audioKey,
            })
            .where(eq(
              schema.upload.id, upload.id
            ))

          break;
        default:
          break;
      }

      await database
        .update(schema.action)
        .set({
          status: 'success',
          completedAt: new Date(),
        })
        .where(
          eq(schema.action.id, action.id)
        )
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;

      await database
        .update(schema.action)
        .set({
          status: 'error',
          error: `Status ${error.response?.status}: ${errorMessage}`,
        })
        .where(
          eq(schema.action.id, action.id)
        )

      break;
    }
  }
}