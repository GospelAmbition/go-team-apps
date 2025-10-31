import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sql, { ensureInitialized } from '../../utils/database'
import { requireAuth } from '../../utils/auth'
import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication
    const user = requireAuth(event)

    // Ensure database is initialized
    await ensureInitialized()

    // Get the video file from the request body
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded',
      })
    }

    const fileData = formData[0]

    if (!fileData.data) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file data',
      })
    }

    // Generate unique video ID and share token
    const videoId = uuidv4()
    const shareToken = randomBytes(16).toString('hex')
    const extension = fileData.filename?.split('.').pop() || 'webm'
    const key = `loomsly/${videoId}.${extension}`

    // Configure S3 client
    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    })

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileData.data,
      ContentType: fileData.type || 'video/webm',
    })

    await s3Client.send(command)

    // Get metadata from formData (other fields sent with the video)
    const metadataFields = formData.filter(field => field.name !== 'video')
    const metadata: any = {}
    for (const field of metadataFields) {
      if (field.data) {
        metadata[field.name || ''] = field.data.toString('utf-8')
      }
    }

    // Parse metadata
    const title = metadata.title || 'Untitled Recording'
    const duration = parseInt(metadata.duration || '0', 10)
    const fileSize = fileData.data.length

    // Save video metadata to database
    const result = await sql`
      INSERT INTO videos (id, user_id, title, s3_key, duration, file_size, share_token)
      VALUES (${videoId}, ${user.userId}, ${title}, ${key}, ${duration}, ${fileSize}, ${shareToken})
      RETURNING *
    `

    const video = result[0]

    return {
      success: true,
      videoId: video.id,
      key: video.s3_key,
      shareToken: video.share_token,
    }
  } catch (error: any) {
    console.error('Error uploading video:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to upload video',
    })
  }
})
