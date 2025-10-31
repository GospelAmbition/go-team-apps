import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { fileName, contentType } = body

    if (!fileName) {
      throw createError({
        statusCode: 400,
        message: 'fileName is required',
      })
    }

    // Generate unique video ID
    const videoId = uuidv4()
    const extension = fileName.split('.').pop() || 'webm'
    const key = `${videoId}.${extension}`

    // Generate pre-signed upload URL
    const uploadUrl = await generateUploadUrl(key, contentType || 'video/webm')

    return {
      success: true,
      videoId,
      key,
      uploadUrl,
    }
  } catch (error: any) {
    console.error('Error generating upload URL:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate upload URL',
    })
  }
})
