import sql, { ensureInitialized } from '../../utils/database'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    // Ensure database is initialized
    await ensureInitialized()

    // Fetch all videos for the authenticated user
    const videos = await sql`
      SELECT
        id,
        title,
        s3_key,
        duration,
        file_size,
        width,
        height,
        thumbnail_url,
        share_token,
        is_public,
        view_count,
        created_at,
        updated_at
      FROM videos
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `

    return {
      success: true,
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        duration: video.duration,
        fileSize: video.file_size,
        width: video.width,
        height: video.height,
        thumbnailUrl: video.thumbnail_url,
        shareToken: video.share_token,
        isPublic: video.is_public,
        viewCount: video.view_count,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      })),
    }
  } catch (error: any) {
    console.error('Error fetching videos:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch videos',
    })
  }
})
