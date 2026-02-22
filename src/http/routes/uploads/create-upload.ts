import { bunnyNetConfig, bunnyStream } from "@/services/bunny-net";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export const createUpload: FastifyPluginAsyncZod = async (server) => {
  server
    .post(
      '/upload-file',
      {
        schema: {
          tags: ['uploads'],
          summary: 'Create a new upload',
          body: z.object({
            title: z.string()
          })
        }
      },
      async (request, reply) => {
        const { title } = request.body

        const data = await bunnyStream.createVideo(title)

        const uploadURL = `https://video.bunnycdn.com/library/${bunnyNetConfig.stream.libraryId}/videos/${data.guid}`

        console.log(data, uploadURL)
        return reply.send({ data, uploadURL })
      }
    )
}