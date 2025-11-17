import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    const body = await readBody(event)
    const { fileName, contentType, withThumbnail } = body

    if (!fileName) {
      throw createError({
        statusCode: 400,
        message: 'fileName is required',
      })
    }

    // Generate unique video ID
    const videoId = uuidv4()
    const extension = fileName.split('.').pop() || 'webm'
    const videoKey = `${videoId}.${extension}`

    // Generate pre-signed upload URL for video
    const videoUploadUrl = await generateUploadUrl(videoKey, contentType || 'video/webm')

    // Generate pre-signed upload URL for thumbnail if requested
    let thumbnailUploadUrl = null
    let thumbnailKey = null
    if (withThumbnail) {
      thumbnailKey = `${videoId}-thumb.jpg`
      thumbnailUploadUrl = await generateUploadUrl(thumbnailKey, 'image/jpeg')
    }

    return {
      success: true,
      videoId,
      videoKey,
      videoUploadUrl,
      thumbnailKey,
      thumbnailUploadUrl,
    }
  } catch (error: any) {
    console.error('Error generating upload URL:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate upload URL',
    })
  }
})
