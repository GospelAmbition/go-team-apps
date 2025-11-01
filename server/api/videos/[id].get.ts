import sql, { ensureInitialized } from '../../utils/database'
import { generateDownloadUrl } from '../../utils/s3'

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
      SELECT
        id,
        title,
        s3_key,
        duration,
        file_size,
        width,
        height,
        thumbnail_url,
        is_public,
        view_count,
        created_at
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

    // Increment view count
    await sql`
      UPDATE videos
      SET view_count = view_count + 1
      WHERE id = ${video.id}
    `

    // Extract just the filename from s3_key (remove "loomsly/" prefix)
    const s3KeyParts = video.s3_key.split('/')
    const filename = s3KeyParts[s3KeyParts.length - 1]

    // Generate pre-signed download URL
    const videoUrl = await generateDownloadUrl(filename)

    return {
      success: true,
      videoId: video.id,
      title: video.title,
      duration: video.duration,
      videoUrl,
    }
  } catch (error: any) {
    console.error('Error getting video URL:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to get video URL',
    })
  }
})
