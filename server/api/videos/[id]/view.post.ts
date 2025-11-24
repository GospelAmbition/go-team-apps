
export default defineEventHandler(async (event) => {
  try {
    const shareToken = getRouterParam(event, 'id')

    if (!shareToken) {
      throw createError({
        statusCode: 400,
        message: 'Video share token is required',
      })
    }

    // Look up video by share token to get the video ID and owner
    const result = await sql`
      SELECT id, user_id, is_public
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

    // Check if current user owns this video
    const currentUser = getAuthUser(event)
    const isOwner = currentUser?.userId === video.user_id

    // Only increment view count if viewer is not the owner
    if (!isOwner) {
      await sql`
        UPDATE videos
        SET view_count = view_count + 1
        WHERE id = ${video.id}
      `
    }

    return {
      success: true,
      counted: !isOwner,
    }
  } catch (error: any) {
    console.error('Error incrementing view count:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to increment view count',
    })
  }
})
