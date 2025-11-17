import { generateThumbnail } from '~/utils/recording-helpers'

export const useVideoUpload = () => {
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const videoId = ref<string | null>(null)
  const shareToken = ref<string | null>(null)
  const shareableLink = ref<string | null>(null)

  // Upload to S3 via pre-signed URLs (bypasses Vercel's 5MB limit)
  const uploadVideo = async (recordedChunks: Blob[], recordedVideoUrl: string, recordingTime: number) => {
    if (!recordedVideoUrl || recordedChunks.length === 0) {
      throw new Error('No recording to upload')
    }

    try {
      isUploading.value = true
      uploadProgress.value = 0

      // Create blob from recorded chunks
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const fileSize = blob.size

      // Generate thumbnail
      const thumbnailBlob = await generateThumbnail(recordedVideoUrl)

      // Step 1: Request pre-signed URLs from server
      const urlResponse = await $fetch('/api/videos/upload-url', {
        method: 'POST',
        body: {
          fileName: `recording-${Date.now()}.webm`,
          contentType: 'video/webm',
          withThumbnail: !!thumbnailBlob,
        },
      })

      if (!urlResponse.success || !urlResponse.videoUploadUrl) {
        throw new Error('Failed to get upload URLs')
      }

      // Step 2: Upload video directly to S3 using pre-signed URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Video upload is 90% of total progress
            const progress = Math.round((e.loaded / e.total) * 90)
            uploadProgress.value = progress
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`Video upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Video upload failed - CORS error. Please configure B2 CORS rules.'))
        })

        xhr.open('PUT', urlResponse.videoUploadUrl)
        xhr.setRequestHeader('Content-Type', 'video/webm')
        xhr.send(blob)
      })

      // Step 3: Upload thumbnail directly to S3 (if exists)
      if (thumbnailBlob && urlResponse.thumbnailUploadUrl) {
        uploadProgress.value = 92 // Show progress update

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              resolve()
            } else {
              reject(new Error(`Thumbnail upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('Thumbnail upload failed - CORS error'))
          })

          xhr.open('PUT', urlResponse.thumbnailUploadUrl)
          xhr.setRequestHeader('Content-Type', 'image/jpeg')
          xhr.send(thumbnailBlob)
        })
      }

      uploadProgress.value = 95

      // Step 4: Save metadata to database
      const completeResponse = await $fetch('/api/videos/upload-complete', {
        method: 'POST',
        body: {
          videoId: urlResponse.videoId,
          videoKey: urlResponse.videoKey,
          thumbnailKey: urlResponse.thumbnailKey,
          duration: recordingTime,
          fileSize,
        },
      })

      if (!completeResponse.success || !completeResponse.shareToken) {
        throw new Error('Failed to save video metadata')
      }

      // Success!
      videoId.value = completeResponse.videoId
      shareToken.value = completeResponse.shareToken
      uploadProgress.value = 100
      isUploading.value = false

      // Generate shareable link using share token
      const siteUrl = window.location.origin
      shareableLink.value = `${siteUrl}/watch/${completeResponse.shareToken}`

      return true
    } catch (err: any) {
      console.error('Error uploading to S3:', err)
      isUploading.value = false
      uploadProgress.value = 0
      throw err
    }
  }

  // Reset upload state
  const resetUpload = () => {
    isUploading.value = false
    uploadProgress.value = 0
    videoId.value = null
    shareToken.value = null
    shareableLink.value = null
  }

  return {
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    videoId: readonly(videoId),
    shareToken: readonly(shareToken),
    shareableLink: readonly(shareableLink),
    uploadVideo,
    resetUpload,
  }
}
