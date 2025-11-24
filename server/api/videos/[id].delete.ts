import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    // Get video ID from URL
    const videoId = getRouterParam(event, 'id')

    if (!videoId) {
      throw createError({
        statusCode: 400,
        message: 'Video ID is required',
      })
    }

    // Get video info before deleting (to get S3 key and verify ownership)
    const videoResult = await sql`
      SELECT s3_key
      FROM videos
      WHERE id = ${videoId} AND user_id = ${user.userId}
    `

    if (videoResult.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Video not found or you do not have permission to delete it',
      })
    }

    const video = videoResult[0]

    // Delete from S3
    try {
      const s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      })

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: video.s3_key,
      })

      await s3Client.send(deleteCommand)
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error)
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await sql`
      DELETE FROM videos
      WHERE id = ${videoId} AND user_id = ${user.userId}
    `

    return {
      success: true,
      message: 'Video deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting video:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete video',
    })
  }
})
