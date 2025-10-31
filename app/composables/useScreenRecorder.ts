export type RecordingMode = 'screen' | 'webcam' | 'both'
export type WebcamPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type WebcamSize = 'small' | 'medium' | 'large'

export const useScreenRecorder = () => {
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const isRecording = ref(false)
  const recordedVideoUrl = ref<string | null>(null)
  const screenStream = ref<MediaStream | null>(null)
  const webcamStream = ref<MediaStream | null>(null)
  const audioStream = ref<MediaStream | null>(null)
  const combinedStream = ref<MediaStream | null>(null)
  const error = ref<string | null>(null)
  const recordingTime = ref(0)
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const videoId = ref<string | null>(null)
  const shareableLink = ref<string | null>(null)

  // Recording settings
  const recordingMode = ref<RecordingMode>('both')
  const webcamPosition = ref<WebcamPosition>('bottom-left')
  const webcamSize = ref<WebcamSize>('medium')
  const showWebcam = ref(true)
  const includeMicrophone = ref(true)

  // Canvas for compositing
  let canvas: HTMLCanvasElement | null = null
  let canvasCtx: CanvasRenderingContext2D | null = null
  let animationFrameId: number | null = null
  let recordingInterval: NodeJS.Timeout | null = null

  // Check if browser supports screen recording
  const isSupported = computed(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && navigator.mediaDevices.getUserMedia)
  })

  // Get webcam size pixels
  const getWebcamDimensions = (canvasWidth: number, canvasHeight: number) => {
    const sizes = {
      small: { width: canvasWidth * 0.15, height: canvasHeight * 0.15 },
      medium: { width: canvasWidth * 0.25, height: canvasHeight * 0.25 },
      large: { width: canvasWidth * 0.35, height: canvasHeight * 0.35 },
    }
    return sizes[webcamSize.value]
  }

  // Get webcam position coordinates
  const getWebcamPosition = (canvasWidth: number, canvasHeight: number, webcamWidth: number, webcamHeight: number) => {
    const padding = 20
    const positions = {
      'top-left': { x: padding, y: padding },
      'top-right': { x: canvasWidth - webcamWidth - padding, y: padding },
      'bottom-left': { x: padding, y: canvasHeight - webcamHeight - padding },
      'bottom-right': { x: canvasWidth - webcamWidth - padding, y: canvasHeight - webcamHeight - padding },
    }
    return positions[webcamPosition.value]
  }

  // Start recording
  const startRecording = async (mode: RecordingMode = 'screen') => {
    try {
      error.value = null
      recordedChunks.value = []
      recordedVideoUrl.value = null
      recordingTime.value = 0
      recordingMode.value = mode

      let videoStream: MediaStream | null = null

      // Get screen stream
      if (mode === 'screen' || mode === 'both') {
        screenStream.value = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true, // System audio
        })
        videoStream = screenStream.value
      }

      // Get webcam stream
      if (mode === 'webcam' || mode === 'both') {
        webcamStream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false, // Audio handled separately
        })

        if (mode === 'webcam') {
          videoStream = webcamStream.value
        }
      }

      // Get microphone audio
      if (includeMicrophone.value) {
        try {
          audioStream.value = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })
        } catch (err) {
          console.warn('Could not access microphone:', err)
        }
      }

      // Combine streams if needed
      if (mode === 'both' && screenStream.value && webcamStream.value) {
        combinedStream.value = await compositeStreams()
        videoStream = combinedStream.value
      }

      if (!videoStream) {
        throw new Error('Failed to get video stream')
      }

      // Combine audio tracks
      const audioTracks: MediaStreamTrack[] = []

      // Add system audio
      if (screenStream.value) {
        const systemAudio = screenStream.value.getAudioTracks()
        audioTracks.push(...systemAudio)
      }

      // Add microphone audio
      if (audioStream.value) {
        const micAudio = audioStream.value.getAudioTracks()
        audioTracks.push(...micAudio)
      }

      // Create final stream with video and all audio
      const finalStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ])

      // Create MediaRecorder instance
      const options = { mimeType: 'video/webm;codecs=vp9' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8'
      }

      mediaRecorder.value = new MediaRecorder(finalStream, options)

      // Handle data available event
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.value.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
        recordedVideoUrl.value = URL.createObjectURL(blob)
        isRecording.value = false

        // Stop recording timer
        if (recordingInterval) {
          clearInterval(recordingInterval)
          recordingInterval = null
        }

        // Stop canvas animation
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }

        // Stop all tracks
        stopAllTracks()
      }

      // Handle user stopping sharing via browser UI
      if (screenStream.value) {
        const videoTrack = screenStream.value.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.onended = () => {
            stopRecording()
          }
        }
      }

      // Start recording
      mediaRecorder.value.start(1000)
      isRecording.value = true

      // Start recording timer
      recordingInterval = setInterval(() => {
        recordingTime.value++
      }, 1000)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      error.value = err.message || 'Failed to start recording'
      isRecording.value = false
      stopAllTracks()
    }
  }

  // Composite screen + webcam into canvas
  const compositeStreams = async (): Promise<MediaStream> => {
    if (!screenStream.value || !webcamStream.value) {
      throw new Error('Screen and webcam streams required for composition')
    }

    // Create video elements
    const screenVideo = document.createElement('video')
    const webcamVideo = document.createElement('video')

    screenVideo.srcObject = screenStream.value
    webcamVideo.srcObject = webcamStream.value

    await screenVideo.play()
    await webcamVideo.play()

    // Wait for metadata to load
    await new Promise<void>((resolve) => {
      if (screenVideo.videoWidth > 0) {
        resolve()
      } else {
        screenVideo.addEventListener('loadedmetadata', () => resolve(), { once: true })
      }
    })

    // Create canvas
    canvas = document.createElement('canvas')
    canvas.width = screenVideo.videoWidth
    canvas.height = screenVideo.videoHeight
    canvasCtx = canvas.getContext('2d')

    if (!canvasCtx) {
      throw new Error('Could not get canvas context')
    }

    // Animation loop to composite frames
    const drawFrame = () => {
      if (!canvasCtx || !canvas) return

      // Draw screen
      canvasCtx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)

      // Draw webcam if visible
      if (showWebcam.value) {
        const dimensions = getWebcamDimensions(canvas.width, canvas.height)
        const position = getWebcamPosition(canvas.width, canvas.height, dimensions.width, dimensions.height)

        // Draw border/shadow
        canvasCtx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        canvasCtx.shadowBlur = 10

        // Draw webcam
        canvasCtx.drawImage(
          webcamVideo,
          position.x,
          position.y,
          dimensions.width,
          dimensions.height
        )

        canvasCtx.shadowBlur = 0
      }

      animationFrameId = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    // Get stream from canvas
    const canvasStream = canvas.captureStream(30) // 30 FPS
    return canvasStream
  }

  // Stop all tracks
  const stopAllTracks = () => {
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => track.stop())
      screenStream.value = null
    }
    if (webcamStream.value) {
      webcamStream.value.getTracks().forEach(track => track.stop())
      webcamStream.value = null
    }
    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => track.stop())
      audioStream.value = null
    }
    if (combinedStream.value) {
      combinedStream.value.getTracks().forEach(track => track.stop())
      combinedStream.value = null
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
    }
  }

  // Toggle webcam visibility
  const toggleWebcam = () => {
    showWebcam.value = !showWebcam.value
  }

  // Upload to S3 via server
  const uploadToS3 = async () => {
    if (!recordedVideoUrl.value || recordedChunks.value.length === 0) {
      error.value = 'No recording to upload'
      return false
    }

    try {
      isUploading.value = true
      uploadProgress.value = 0
      error.value = null

      // Create blob from recorded chunks
      const blob = new Blob(recordedChunks.value, { type: 'video/webm' })

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', blob, `recording-${Date.now()}.webm`)

      // Upload via server-side API
      const xhr = new XMLHttpRequest()

      return new Promise<boolean>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)

            if (response && response.videoId) {
              videoId.value = response.videoId
              isUploading.value = false
              uploadProgress.value = 100

              // Generate shareable link
              const siteUrl = window.location.origin
              shareableLink.value = `${siteUrl}/watch/${videoId.value}`

              // Save to localStorage video library
              saveToLibrary({
                id: videoId.value!,
                key: response.key,
                createdAt: new Date().toISOString(),
                duration: recordingTime.value,
                shareLink: shareableLink.value,
                mode: recordingMode.value,
              })

              resolve(true)
            } else {
              reject(new Error('Invalid response from server'))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.open('POST', '/api/videos/upload')
        xhr.send(formData)
      })
    } catch (err: any) {
      console.error('Error uploading to S3:', err)
      error.value = err.message || 'Failed to upload video'
      isUploading.value = false
      return false
    }
  }

  // Save video to localStorage library
  const saveToLibrary = (video: any) => {
    try {
      const existingVideos = JSON.parse(localStorage.getItem('loomsly_videos') || '[]')
      existingVideos.unshift(video)
      localStorage.setItem('loomsly_videos', JSON.stringify(existingVideos))
    } catch (err) {
      console.error('Error saving to library:', err)
    }
  }

  // Download recorded video
  const downloadRecording = () => {
    if (!recordedVideoUrl.value) return

    const a = document.createElement('a')
    a.href = recordedVideoUrl.value
    a.download = `screen-recording-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Reset/clear recording
  const resetRecording = () => {
    if (recordedVideoUrl.value) {
      URL.revokeObjectURL(recordedVideoUrl.value)
    }
    recordedVideoUrl.value = null
    recordedChunks.value = []
    recordingTime.value = 0
    error.value = null
    isUploading.value = false
    uploadProgress.value = 0
    videoId.value = null
    shareableLink.value = null
  }

  // Format recording time as MM:SS
  const formattedTime = computed(() => {
    const minutes = Math.floor(recordingTime.value / 60)
    const seconds = recordingTime.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopAllTracks()
    if (recordedVideoUrl.value) {
      URL.revokeObjectURL(recordedVideoUrl.value)
    }
    if (recordingInterval) {
      clearInterval(recordingInterval)
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  })

  return {
    // State
    isSupported,
    isRecording,
    recordedVideoUrl,
    error,
    recordingTime,
    formattedTime,
    isUploading,
    uploadProgress,
    videoId,
    shareableLink,

    // Recording settings
    recordingMode,
    webcamPosition,
    webcamSize,
    showWebcam,
    includeMicrophone,

    // Methods
    startRecording,
    stopRecording,
    toggleWebcam,
    uploadToS3,
    downloadRecording,
    resetRecording,
  }
}
