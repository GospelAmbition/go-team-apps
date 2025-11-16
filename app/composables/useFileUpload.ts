import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface UploadProgress {
  stage: 'validating' | 'compressing' | 'uploading' | 'finalizing' | 'complete' | 'error'
  progress: number
  message: string
  estimatedTimeRemaining?: number
}

interface VideoMetadata {
  duration: number
  width: number
  height: number
  fileSize: number
  originalFileSize: number
  compressionRatio?: number
}

const ACCEPTED_FORMATS = ['.mp4', '.mov', '.webm', '.avi']
const ACCEPTED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-msvideo']
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const COMPRESSION_THRESHOLD = 50 * 1024 * 1024 // 50MB

export const useFileUpload = () => {
  const uploadProgress = ref<UploadProgress>({
    stage: 'validating',
    progress: 0,
    message: 'Ready to upload'
  })

  const selectedFile = ref<File | null>(null)
  const videoMetadata = ref<VideoMetadata | null>(null)
  const videoPreviewUrl = ref<string | null>(null)
  const isUploading = ref(false)
  const error = ref<string | null>(null)
  const shareToken = ref<string | null>(null)
  const videoId = ref<string | null>(null)

  let ffmpeg: FFmpeg | null = null
  let ffmpegLoaded = false

  // Detect if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File exceeds 2GB limit. Please choose a smaller file.' }
    }

    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_FORMATS.some(ext => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Invalid file format. Please upload a video file (${ACCEPTED_FORMATS.join(', ')})`
      }
    }

    // Check MIME type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not recognized as a video. Please select a valid video file.'
      }
    }

    return { valid: true }
  }

  // Extract video metadata
  const extractVideoMetadata = async (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve({
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight,
          fileSize: file.size,
          originalFileSize: file.size
        })
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        reject(new Error('Unable to read video metadata. The file may be corrupted.'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  // Generate thumbnail from video
  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        video.currentTime = 1 // Seek to 1 second
      }

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            window.URL.revokeObjectURL(video.src)
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
          }, 'image/jpeg', 0.8)
        } else {
          reject(new Error('Failed to get canvas context'))
        }
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        reject(new Error('Failed to load video for thumbnail'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  // Load FFmpeg
  const loadFFmpeg = async () => {
    if (ffmpegLoaded) return

    try {
      uploadProgress.value = {
        stage: 'compressing',
        progress: 0,
        message: 'Loading video processor...'
      }

      ffmpeg = new FFmpeg()

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message)
      })

      ffmpeg.on('progress', ({ progress, time }) => {
        const percentage = Math.round(progress * 100)
        uploadProgress.value = {
          stage: 'compressing',
          progress: percentage,
          message: `Optimizing video for web viewing... ${percentage}%`
        }
      })

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      ffmpegLoaded = true
    } catch (err) {
      console.error('FFmpeg load error:', err)
      throw new Error('Failed to load video processor. Please try uploading a smaller file.')
    }
  }

  // Compress video using FFmpeg
  const compressVideo = async (file: File): Promise<Blob> => {
    if (!ffmpeg) {
      throw new Error('FFmpeg not loaded')
    }

    try {
      const inputFileName = 'input.mp4'
      const outputFileName = 'output.mp4'

      uploadProgress.value = {
        stage: 'compressing',
        progress: 5,
        message: 'Preparing video for compression...'
      }

      // Write file to FFmpeg virtual filesystem
      await ffmpeg.writeFile(inputFileName, await fetchFile(file))

      uploadProgress.value = {
        stage: 'compressing',
        progress: 10,
        message: 'Compressing video...'
      }

      // Compress with H.264 + AAC
      await ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputFileName
      ])

      // Read compressed file
      const data = await ffmpeg.readFile(outputFileName)
      const compressedBlob = new Blob([data], { type: 'video/mp4' })

      // Cleanup
      await ffmpeg.deleteFile(inputFileName)
      await ffmpeg.deleteFile(outputFileName)

      uploadProgress.value = {
        stage: 'compressing',
        progress: 100,
        message: `Compression complete! Reduced from ${formatFileSize(file.size)} to ${formatFileSize(compressedBlob.size)}`
      }

      return compressedBlob
    } catch (err) {
      console.error('Compression error:', err)
      throw new Error('Video compression failed. Uploading original file instead.')
    }
  }

  // Upload to S3
  const uploadToS3 = async (videoBlob: Blob, thumbnailBlob: Blob, originalFileName: string, metadata: VideoMetadata) => {
    try {
      uploadProgress.value = {
        stage: 'uploading',
        progress: 0,
        message: 'Requesting upload URL...'
      }

      // Get pre-signed upload URLs
      const response = await $fetch('/api/videos/upload-url', {
        method: 'POST',
        body: {
          fileName: originalFileName,
          contentType: 'video/mp4',
          withThumbnail: true
        }
      })

      if (!response.success) {
        throw new Error('Failed to get upload URL')
      }

      const { videoId: vid, videoUploadUrl, thumbnailUploadUrl } = response

      videoId.value = vid

      uploadProgress.value = {
        stage: 'uploading',
        progress: 10,
        message: 'Uploading video...'
      }

      // Upload video
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded / e.total) * 80) + 10 // 10-90%
            uploadProgress.value = {
              stage: 'uploading',
              progress: percentage,
              message: `Uploading video... ${percentage}%`
            }
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('PUT', videoUploadUrl)
        xhr.setRequestHeader('Content-Type', 'video/mp4')
        xhr.send(videoBlob)
      })

      uploadProgress.value = {
        stage: 'uploading',
        progress: 92,
        message: 'Uploading thumbnail...'
      }

      // Upload thumbnail
      await fetch(thumbnailUploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg'
        },
        body: thumbnailBlob
      })

      uploadProgress.value = {
        stage: 'finalizing',
        progress: 95,
        message: 'Finalizing upload...'
      }

      // Complete upload
      const completeResponse = await $fetch('/api/videos/upload-complete', {
        method: 'POST',
        body: {
          videoId: vid,
          videoKey: response.videoKey,
          thumbnailKey: response.thumbnailKey,
          duration: metadata.duration,
          fileSize: videoBlob.size,
          width: metadata.width,
          height: metadata.height,
          source: 'upload',
          originalFilename: originalFileName,
          originalFileSize: metadata.originalFileSize,
          compressionRatio: metadata.compressionRatio
        }
      })

      if (!completeResponse.success) {
        throw new Error('Failed to finalize upload')
      }

      shareToken.value = completeResponse.shareToken

      uploadProgress.value = {
        stage: 'complete',
        progress: 100,
        message: 'Upload complete!'
      }

      return completeResponse
    } catch (err: any) {
      console.error('Upload error:', err)
      throw new Error(err.message || 'Upload failed. Please try again.')
    }
  }

  // Main upload function
  const uploadVideo = async () => {
    if (!selectedFile.value) {
      error.value = 'No file selected'
      return
    }

    isUploading.value = true
    error.value = null

    try {
      const file = selectedFile.value

      // Stage 1: Validate file
      uploadProgress.value = {
        stage: 'validating',
        progress: 0,
        message: 'Analyzing video...'
      }

      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Extract metadata
      const metadata = await extractVideoMetadata(file)
      videoMetadata.value = metadata

      // Generate thumbnail
      const thumbnailBlob = await generateThumbnail(file)

      // Stage 2: Compress if needed
      let videoBlob: Blob = file
      let compressionRatio: number | undefined

      const shouldCompress = file.size >= COMPRESSION_THRESHOLD && !isMobile()

      if (shouldCompress) {
        uploadProgress.value = {
          stage: 'compressing',
          progress: 0,
          message: 'This will reduce file size by ~90%'
        }

        try {
          await loadFFmpeg()
          const compressedBlob = await compressVideo(file)

          compressionRatio = parseFloat(((file.size - compressedBlob.size) / file.size * 100).toFixed(2))
          videoBlob = compressedBlob

          if (videoMetadata.value) {
            videoMetadata.value.fileSize = compressedBlob.size
            videoMetadata.value.compressionRatio = compressionRatio
          }
        } catch (compressionError: any) {
          console.warn('Compression failed, uploading original:', compressionError)
          // Continue with original file
          uploadProgress.value = {
            stage: 'uploading',
            progress: 0,
            message: 'Uploading original file...'
          }
        }
      } else if (file.size >= COMPRESSION_THRESHOLD && isMobile()) {
        uploadProgress.value = {
          stage: 'uploading',
          progress: 0,
          message: 'Large file detected. This may take a while on mobile...'
        }
      }

      // Stage 3: Upload to S3
      await uploadToS3(videoBlob, thumbnailBlob, file.name, videoMetadata.value!)

      // Success!
      isUploading.value = false
    } catch (err: any) {
      console.error('Upload failed:', err)
      error.value = err.message || 'Upload failed. Please try again.'
      uploadProgress.value = {
        stage: 'error',
        progress: 0,
        message: error.value
      }
      isUploading.value = false
    }
  }

  // Select file
  const selectFile = async (file: File) => {
    selectedFile.value = file
    error.value = null

    // Create preview URL
    if (videoPreviewUrl.value) {
      URL.revokeObjectURL(videoPreviewUrl.value)
    }
    videoPreviewUrl.value = URL.createObjectURL(file)

    // Validate immediately
    const validation = validateFile(file)
    if (!validation.valid) {
      error.value = validation.error
      return
    }

    // Extract metadata for preview
    try {
      const metadata = await extractVideoMetadata(file)
      videoMetadata.value = metadata
    } catch (err: any) {
      error.value = err.message
    }
  }

  // Reset state
  const reset = () => {
    selectedFile.value = null
    videoMetadata.value = null
    if (videoPreviewUrl.value) {
      URL.revokeObjectURL(videoPreviewUrl.value)
    }
    videoPreviewUrl.value = null
    isUploading.value = false
    error.value = null
    shareToken.value = null
    videoId.value = null
    uploadProgress.value = {
      stage: 'validating',
      progress: 0,
      message: 'Ready to upload'
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return {
    // State
    selectedFile,
    videoMetadata,
    videoPreviewUrl,
    isUploading,
    error,
    uploadProgress,
    shareToken,
    videoId,

    // Methods
    selectFile,
    uploadVideo,
    reset,
    formatFileSize,
    formatDuration,

    // Constants
    ACCEPTED_FORMATS,
    MAX_FILE_SIZE
  }
}
