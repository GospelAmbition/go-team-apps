import { v4 as uuidv4 } from 'uuid'
import { generateUploadUrl } from '#server/utils/video-storage'

const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi']
const ALLOWED_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo']
const MAX_FILENAME_LENGTH = 255

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    const body = await readBody(event)
    const { fileName, contentType, withThumbnail } = body

    if (!fileName || typeof fileName !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'fileName is required',
      })
    }

    if (fileName.length > MAX_FILENAME_LENGTH) {
      throw createError({
        statusCode: 400,
        message: 'fileName is too long',
      })
    }

    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw createError({
        statusCode: 400,
        message: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      })
    }

    const resolvedContentType = contentType || 'video/webm'
    if (!ALLOWED_CONTENT_TYPES.includes(resolvedContentType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      })
    }

    // Generate unique video ID
    const videoId = uuidv4()
    const videoKey = `${videoId}.${extension}`

    // Generate pre-signed upload URL for video
    const videoUploadUrl = await generateUploadUrl(videoKey, resolvedContentType)

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
      statusCode: error.statusCode || 500,
      message: error.statusCode ? error.message : 'Failed to generate upload URL',
    })
  }
})
