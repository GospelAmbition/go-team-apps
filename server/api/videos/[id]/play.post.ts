
export default defineEventHandler(async (event) => {
  try {
    // Ensure database is initialized
    await ensureInitialized()

    const shareToken = getRouterParam(event, 'id')

    if (!shareToken) {
      throw createError({
        statusCode: 400,
        message: 'Video share token is required',
      })
    }

    // Look up video by share token
    const result = await sql`
      SELECT id, is_public
      FROM videos
      WHERE share_token = ${shareToken}
    `

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Video not found',
      })
    }

    const video = result[0]

    // Check if video is public
    if (!video.is_public) {
      throw createError({
        statusCode: 403,
        message: 'This video is private',
      })
    }

    // Increment play count (no owner check - we count all plays)
    await sql`
      UPDATE videos
      SET play_count = play_count + 1
      WHERE id = ${video.id}
    `

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error incrementing play count:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to increment play count',
    })
  }
})
