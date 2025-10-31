export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Video ID is required',
      })
    }

    // For now, assume the file is .webm
    // In a real app, we'd look this up in a database
    const key = `${id}.webm`

    // Generate pre-signed download URL
    const videoUrl = await generateDownloadUrl(key)

    return {
      success: true,
      videoId: id,
      videoUrl,
    }
  } catch (error: any) {
    console.error('Error getting video URL:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get video URL',
    })
  }
})
