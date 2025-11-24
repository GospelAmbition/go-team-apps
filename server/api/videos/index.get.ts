import { generateDownloadUrl } from '#server/utils/video-storage'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

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

    // Generate pre-signed URLs for thumbnails
    const videosWithThumbnails = await Promise.all(videos.map(async (video) => {
      let thumbnailUrl = null
      if (video.thumbnail_url) {
        try {
          // Extract filename from s3 key
          const thumbnailKey = video.thumbnail_url.split('/').pop()
          thumbnailUrl = await generateDownloadUrl(thumbnailKey)
        } catch (err) {
          console.error('Error generating thumbnail URL:', err)
        }
      }

      return {
        id: video.id,
        title: video.title,
        duration: video.duration,
        fileSize: video.file_size,
        width: video.width,
        height: video.height,
        thumbnailUrl,
        shareToken: video.share_token,
        isPublic: video.is_public,
        viewCount: video.view_count,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      }
    }))

    return {
      success: true,
      videos: videosWithThumbnails,
    }
  } catch (error: any) {
    console.error('Error fetching videos:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch videos',
    })
  }
})
