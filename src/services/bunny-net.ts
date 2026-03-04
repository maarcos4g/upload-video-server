import { env } from "@/env";
import { BadRequestError } from "@/http/errors/bad-request-error";

type VideoResponse = {
  videoLibraryId: number
  guid: string
  title: string
  description: string | null
  dateUploaded: string
  length: number
  status: number
  availableResolutions: string
  thumbnailCount: number
  storageSize: number
  captions: {
    srclang: string
    label: string
    version: number
  }[]
  hasMP4Fallback: boolean
  thumbnailFileName: string
  moments: {
    label: string
    timestamp: number
  }[]
  metaTags: {
    property: string
    value: string
  }[]
}

export const bunnyNetConfig = {
  stream: {
    libraryId: env.BUNNY_LIBRARY_ID.trim(),
    apiKey: env.BUNNY_API_KEY.trim(),
    baseURL: 'https://video.bunnycdn.com',
    pullZone: env.BUNNY_NET_PULL_ZONE
  }
}

export const bunnyStream = {
  async createVideo(title: string): Promise<VideoResponse> {
    const URL = `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos`
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        AccessKey: bunnyNetConfig.stream.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Bunny API Error:', errorData)
      throw new BadRequestError('Bunny API Error')
    }

    return response.json() as Promise<VideoResponse>
  },
  getUploadURL(videoId: string) {
    return `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos/${videoId}`
  },
  async getVideoDetails(videoId: string): Promise<VideoResponse> {
    const URL = `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos/${videoId}`

    const response = await fetch(URL, {
      method: 'GET',
      headers: {
        AccessKey: bunnyNetConfig.stream.apiKey,
        accept: 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Bunny API Error:', errorData)
      throw new BadRequestError('Could not fetch video details from Bunny')
    }

    return response.json() as Promise<VideoResponse>
  },
  async triggerSmartGenerateMetatadas(videoId: string, options: { generateTitle?: boolean; generateDescription?: boolean }) {
    const URL = `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos/${videoId}/smart`

    const bodyObject = {
      generateTitle: options.generateTitle ?? true,
      generateDescription: options.generateDescription ?? true,
    }

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        AccessKey: bunnyNetConfig.stream.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyObject)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Bunny API Error:', errorData)
      throw new BadRequestError('Could not generate metadata for this video')
    }

    return response.json()
  },
  async fetchTranscriptionFromBunny(videoId: string) {
    try {
      const vttURL = `https://${bunnyNetConfig.stream.pullZone}/${videoId}/captions/pt-auto.vtt`

      const vttResponse = await fetch(vttURL)
      if (vttResponse.ok) {
        const transcription = await vttResponse.text()
        return transcription
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar VTT:', error)
    }
  },
  async deleteVideo(videoId: string) {
    const URL = `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos/${videoId}`

    const response = await fetch(URL, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        AccessKey: bunnyNetConfig.stream.apiKey,
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new BadRequestError(
        `Failed to delete video from Bunny. Status: ${response.status}. Response: ${JSON.stringify(errorData)}`
      )
    }

    return true
  },
  async updateVideo(videoId: string, updates: Partial<VideoResponse>): Promise<VideoResponse> {
    const URL = `${bunnyNetConfig.stream.baseURL}/library/${bunnyNetConfig.stream.libraryId}/videos/${videoId}`

    const body: Record<string, any> = {}
    if (updates.title) body.title = updates.title
    if (updates.description) body.description = updates.description

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        AccessKey: bunnyNetConfig.stream.apiKey,
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Bunny API Error:', errorData)
      throw new BadRequestError('Could not update video details in Bunny')
    }

    return response.json() as Promise<VideoResponse>
  }
}