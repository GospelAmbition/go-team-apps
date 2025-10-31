import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Config = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for Backblaze B2
}

const s3Client = new S3Client(s3Config)
const bucketName = process.env.S3_BUCKET_NAME || ''

export const generateUploadUrl = async (key: string, contentType: string = 'video/webm') => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `loomsly/${key}`,
    ContentType: contentType,
  })

  // Generate pre-signed URL valid for 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return url
}

export const generateDownloadUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: `loomsly/${key}`,
  })

  // Generate pre-signed URL valid for 24 hours
  const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 })
  return url
}

export const getPublicUrl = (key: string) => {
  // For public access (if bucket is configured for public read)
  const endpoint = process.env.S3_ENDPOINT?.replace('https://', '') || ''
  return `https://${endpoint}/${bucketName}/loomsly/${key}`
}
