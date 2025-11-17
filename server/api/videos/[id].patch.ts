
export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    // Ensure database is initialized
    await ensureInitialized()

    // Get video ID from URL
    const videoId = getRouterParam(event, 'id')

    if (!videoId) {
      throw createError({
        statusCode: 400,
        message: 'Video ID is required',
      })
    }

    // Get request body
    const body = await readBody(event)
    const { title } = body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw createError({
        statusCode: 400,
        message: 'Valid title is required',
      })
    }

    // Update video title (only if user owns the video)
    const result = await sql`
      UPDATE videos
      SET title = ${title.trim()}, updated_at = NOW()
      WHERE id = ${videoId} AND user_id = ${user.userId}
      RETURNING *
    `

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Video not found or you do not have permission to edit it',
      })
    }

    const video = result[0]

    return {
      success: true,
      video: {
        id: video.id,
        title: video.title,
        updatedAt: video.updated_at,
      },
    }
  } catch (error: any) {
    console.error('Error updating video:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update video',
    })
  }
})
