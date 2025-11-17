import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    // Ensure database is initialized
    await ensureInitialized()

    const body = await readBody(event)
    const { videoId, videoKey, thumbnailKey, duration, fileSize } = body

    if (!videoId || !videoKey) {
      throw createError({
        statusCode: 400,
        message: 'videoId and videoKey are required',
      })
    }

    // Generate share token
    const shareToken = randomBytes(16).toString('hex')

    // Generate default title from current date and time (e.g., "Nov 2, 2025 10:30am")
    const now = new Date()
    const datePart = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timePart = now.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase().replace(/\s/g, '')
    const title = `${datePart} ${timePart}`

    // Build S3 key with videos/ prefix
    const s3Key = `videos/${videoKey}`
    const thumbnailS3Key = thumbnailKey ? `videos/${thumbnailKey}` : null

    // Save video metadata to database
    const result = await sql`
      INSERT INTO videos (id, user_id, title, s3_key, duration, file_size, share_token, thumbnail_url)
      VALUES (${videoId}, ${user.userId}, ${title}, ${s3Key}, ${duration || 0}, ${fileSize || 0}, ${shareToken}, ${thumbnailS3Key})
      RETURNING *
    `

    const video = result[0]

    return {
      success: true,
      videoId: video.id,
      shareToken: video.share_token,
    }
  } catch (error: any) {
    console.error('Error saving video metadata:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to save video metadata',
    })
  }
})
