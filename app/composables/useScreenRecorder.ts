export type RecordingMode = 'screen' | 'webcam' | 'both'

export const useScreenRecorder = () => {
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordedChunks = ref<Blob[]>([])
  const isRecording = ref(false)
  const isPaused = ref(false)
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
  const shareToken = ref<string | null>(null)
  const shareableLink = ref<string | null>(null)
  const countdown = ref(0)
  const isPreparingRecording = ref(false)
  const tabRecordingFallback = ref(false)
  const displaySurfaceType = ref<string | null>(null) // 'monitor', 'window', or 'browser'
  const isPositioning = ref(false) // NEW: For monitor recording - show positioning step

  // Recording settings
  const recordingMode = ref<RecordingMode>('both')
  const showWebcam = ref(true)
  const includeAudio = ref(true)

  // Canvas for compositing
  let canvas: HTMLCanvasElement | null = null
  let canvasCtx: CanvasRenderingContext2D | null = null
  let animationFrameId: number | null = null
  let recordingInterval: NodeJS.Timeout | null = null
  let audioMixerContext: AudioContext | null = null

  // Picture-in-Picture support
  let pipVideoElement: HTMLVideoElement | null = null
  const isPipActive = ref(false)

  // Check if browser supports screen recording
  const isSupported = computed(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && navigator.mediaDevices.getUserMedia)
  })

  // Get webcam size pixels (always medium)
  const getWebcamDimensions = (canvasWidth: number, canvasHeight: number) => {
    return { width: canvasWidth * 0.25, height: canvasHeight * 0.25 }
  }

  // Get webcam position coordinates (always bottom-right)
  const getWebcamPosition = (canvasWidth: number, canvasHeight: number, webcamWidth: number, webcamHeight: number) => {
    const padding = 20
    return { x: canvasWidth - webcamWidth - padding, y: canvasHeight - webcamHeight - padding }
  }

  // Start recording with countdown
  const startRecording = async (mode: RecordingMode = 'screen', preferredDisplaySurface?: 'monitor' | 'window' | 'browser') => {
    try {
      error.value = null
      recordedChunks.value = []
      recordedVideoUrl.value = null
      recordingTime.value = 0
      recordingMode.value = mode
      tabRecordingFallback.value = false
      displaySurfaceType.value = null
      isPreparingRecording.value = true

      let videoStream: MediaStream | null = null
      let skipCountdown = false // Skip countdown for window/tab recordings

      // Get screen stream
      if (mode === 'screen' || mode === 'both') {
        const displayMediaConstraints: DisplayMediaStreamOptions = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          } as MediaTrackConstraints,
          audio: true, // System audio
        }

        // Add display surface preference if provided
        if (preferredDisplaySurface) {
          (displayMediaConstraints.video as MediaTrackConstraints).displaySurface = preferredDisplaySurface
        }

        screenStream.value = await navigator.mediaDevices.getDisplayMedia(displayMediaConstraints)
        videoStream = screenStream.value

        // Check if user selected a tab or window
        const videoTrack = screenStream.value.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()

          // Store the display surface type for later use
          displaySurfaceType.value = settings.displaySurface as string

          // Skip countdown for window and tab recordings since user can't see it
          // (browser switches to the selected window/tab immediately)
          if (settings.displaySurface === 'browser' || settings.displaySurface === 'window') {
            skipCountdown = true
          }

          // For tab recordings in "both" mode, we'll rely on Picture-in-Picture
          // to keep canvas rendering active. No fallback needed with PiP!
          if (settings.displaySurface === 'browser' && mode === 'both') {
            tabRecordingFallback.value = true
            // Continue with both mode - PiP will handle the canvas rendering
          }
        }
      }

      // Get webcam stream
      if (mode === 'webcam' || mode === 'both') {
        webcamStream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: mode === 'webcam', // Capture audio directly for webcam-only mode
        })

        if (mode === 'webcam') {
          videoStream = webcamStream.value
        }
      }

      // Get microphone audio if user wants it
      if (includeAudio.value && mode !== 'webcam') {
        try {
          audioStream.value = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          })
        } catch (err) {
          console.error('Could not access microphone:', err)
        }
      }

      // NEW: For monitor + both mode, use PiP positioning approach (no canvas)
      if (mode === 'both' && displaySurfaceType.value === 'monitor' && webcamStream.value) {
        // Open PiP for positioning
        try {
          pipVideoElement = document.createElement('video')
          pipVideoElement.srcObject = webcamStream.value
          pipVideoElement.muted = true
          pipVideoElement.playsInline = true

          await pipVideoElement.play()

          if (document.pictureInPictureEnabled && pipVideoElement.requestPictureInPicture) {
            await pipVideoElement.requestPictureInPicture()
            isPipActive.value = true

            pipVideoElement.addEventListener('leavepictureinpicture', () => {
              isPipActive.value = false
              console.log('Picture-in-Picture exited')
            })
          }
        } catch (pipError) {
          console.warn('Picture-in-Picture not available:', pipError)
        }

        // Set positioning mode and return early
        isPositioning.value = true
        isPreparingRecording.value = false
        return
      }

      // For tab/window + both mode, use canvas compositing (original approach)
      if (mode === 'both' && screenStream.value && webcamStream.value) {
        combinedStream.value = await compositeStreams()
        videoStream = combinedStream.value
      }

      if (!videoStream) {
        throw new Error('Failed to get video stream')
      }

      // Combine audio tracks
      // If we have multiple audio sources, mix them using Web Audio API
      let finalAudioTrack: MediaStreamTrack | null = null

      const audioSources: MediaStream[] = []

      // Collect all audio sources
      if (screenStream.value && screenStream.value.getAudioTracks().length > 0) {
        audioSources.push(screenStream.value)
      }

      if (audioStream.value && audioStream.value.getAudioTracks().length > 0) {
        audioSources.push(audioStream.value)
      }

      if (mode === 'webcam' && webcamStream.value && webcamStream.value.getAudioTracks().length > 0) {
        audioSources.push(webcamStream.value)
      }

      // Mix multiple audio sources using Web Audio API
      if (audioSources.length > 1) {
        try {
          audioMixerContext = new AudioContext()
          const destination = audioMixerContext.createMediaStreamDestination()

          // Connect all audio sources to the destination
          audioSources.forEach(source => {
            const audioSource = audioMixerContext!.createMediaStreamSource(source)
            audioSource.connect(destination)
          })

          finalAudioTrack = destination.stream.getAudioTracks()[0]
        } catch (err) {
          console.error('Failed to mix audio tracks:', err)
          // Fallback to first audio track only
          finalAudioTrack = audioSources[0].getAudioTracks()[0]
        }
      } else if (audioSources.length === 1) {
        // Only one audio source, use it directly
        finalAudioTrack = audioSources[0].getAudioTracks()[0]
      }

      // Create final stream with video and mixed audio
      const finalStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(finalAudioTrack ? [finalAudioTrack] : [])
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

        // Close audio mixer context
        if (audioMixerContext) {
          audioMixerContext.close()
          audioMixerContext = null
        }

        // Exit Picture-in-Picture and cleanup
        if (pipVideoElement) {
          if (document.pictureInPictureElement === pipVideoElement) {
            document.exitPictureInPicture().catch(err => console.log('PiP exit error:', err))
          }
          pipVideoElement.srcObject = null
          pipVideoElement = null
          isPipActive.value = false
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

      // Preparation complete, now show countdown (unless recording window/tab)
      isPreparingRecording.value = false

      // Countdown before starting recording (3, 2, 1)
      // Skip countdown for window/tab recordings since user can't see it anyway
      if (!skipCountdown) {
        countdown.value = 3
        await new Promise<void>((resolve) => {
          const countdownInterval = setInterval(() => {
            countdown.value--
            if (countdown.value === 0) {
              clearInterval(countdownInterval)
              resolve()
            }
          }, 1000)
        })
      }

      // Start recording
      mediaRecorder.value.start(1000)
      isRecording.value = true

      // Start recording timer
      recordingInterval = setInterval(() => {
        if (!isPaused.value) {
          recordingTime.value++
        }
      }, 1000)
    } catch (err: any) {
      console.error('Error starting recording:', err)
      error.value = err.message || 'Failed to start recording'
      isRecording.value = false
      isPreparingRecording.value = false
      // Don't reset isPositioning or stop tracks if we're in positioning mode
      if (!isPositioning.value) {
        stopAllTracks()
      }
    }
  }

  // NEW: Finalize recording after PiP positioning (for monitor + both mode)
  const finalizeRecording = async () => {
    try {
      error.value = null
      recordedChunks.value = []
      recordedVideoUrl.value = null
      recordingTime.value = 0

      if (!screenStream.value) {
        throw new Error('No screen stream available')
      }

      // Record screen directly (no canvas)
      const videoStream = screenStream.value

      // Combine audio tracks
      let finalAudioTrack: MediaStreamTrack | null = null
      const audioSources: MediaStream[] = []

      // Collect all audio sources
      if (screenStream.value && screenStream.value.getAudioTracks().length > 0) {
        audioSources.push(screenStream.value)
      }

      if (audioStream.value && audioStream.value.getAudioTracks().length > 0) {
        audioSources.push(audioStream.value)
      }

      // Mix multiple audio sources using Web Audio API
      if (audioSources.length > 1) {
        try {
          audioMixerContext = new AudioContext()
          const destination = audioMixerContext.createMediaStreamDestination()

          audioSources.forEach(source => {
            const audioSource = audioMixerContext!.createMediaStreamSource(source)
            audioSource.connect(destination)
          })

          finalAudioTrack = destination.stream.getAudioTracks()[0]
        } catch (err) {
          console.error('Failed to mix audio tracks:', err)
          finalAudioTrack = audioSources[0].getAudioTracks()[0]
        }
      } else if (audioSources.length === 1) {
        finalAudioTrack = audioSources[0].getAudioTracks()[0]
      }

      // Create final stream with video and mixed audio
      const finalStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(finalAudioTrack ? [finalAudioTrack] : [])
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

        // Close audio mixer context
        if (audioMixerContext) {
          audioMixerContext.close()
          audioMixerContext = null
        }

        // Exit Picture-in-Picture and cleanup
        if (pipVideoElement) {
          if (document.pictureInPictureElement === pipVideoElement) {
            document.exitPictureInPicture().catch(err => console.log('PiP exit error:', err))
          }
          pipVideoElement.srcObject = null
          pipVideoElement = null
          isPipActive.value = false
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

      // Start recording immediately (no countdown needed)
      mediaRecorder.value.start(1000)
      isRecording.value = true
      isPositioning.value = false

      // Start recording timer
      recordingInterval = setInterval(() => {
        if (!isPaused.value) {
          recordingTime.value++
        }
      }, 1000)

      return true
    } catch (err: any) {
      console.error('Error finalizing recording:', err)
      error.value = err.message || 'Failed to start recording'
      isRecording.value = false
      isPositioning.value = false
      return false
    }
  }

  // Cancel positioning and cleanup
  const cancelPositioning = () => {
    if (pipVideoElement) {
      if (document.pictureInPictureElement === pipVideoElement) {
        document.exitPictureInPicture().catch(err => console.log('PiP exit error:', err))
      }
      pipVideoElement.srcObject = null
      pipVideoElement = null
      isPipActive.value = false
    }
    stopAllTracks()
    isPositioning.value = false
    displaySurfaceType.value = null
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

      // Always draw webcam overlay during recording (showWebcam only affects preview)
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

      animationFrameId = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    // Get stream from canvas
    const canvasStream = canvas.captureStream(30) // 30 FPS

    // Enable Picture-in-Picture to keep canvas rendering active when tab is backgrounded
    // Show only the webcam in PiP to avoid capturing the PiP window in the screen recording
    try {
      // Create a video element for PiP showing just the webcam
      pipVideoElement = document.createElement('video')
      pipVideoElement.srcObject = webcamStream.value // Use webcam stream instead of composite
      pipVideoElement.muted = true
      pipVideoElement.playsInline = true

      // Start playing the video
      await pipVideoElement.play()

      // Request Picture-in-Picture
      if (document.pictureInPictureEnabled && pipVideoElement.requestPictureInPicture) {
        await pipVideoElement.requestPictureInPicture()
        isPipActive.value = true

        // Only hide webcam overlay for entire screen (monitor) recordings
        // For tab/window recordings: keep webcam overlay since PiP won't be captured
        const isEntireScreen = displaySurfaceType.value === 'monitor'
        if (isEntireScreen) {
          showWebcam.value = false
        }

        // Handle PiP exit - re-enable webcam overlay for screen recordings
        pipVideoElement.addEventListener('leavepictureinpicture', () => {
          isPipActive.value = false
          if (isEntireScreen) {
            showWebcam.value = true // Re-enable webcam overlay if PiP is closed
          }
          console.log('Picture-in-Picture exited')
        })
      }
    } catch (pipError) {
      console.warn('Picture-in-Picture not available:', pipError)
      // PiP is optional, continue without it
    }

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

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorder.value && isRecording.value && !isPaused.value && mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.pause()
      isPaused.value = true
    }
  }

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorder.value && isRecording.value && isPaused.value && mediaRecorder.value.state === 'paused') {
      mediaRecorder.value.resume()
      isPaused.value = false
    }
  }

  // Toggle webcam visibility
  const toggleWebcam = () => {
    showWebcam.value = !showWebcam.value
  }

  // Generate thumbnail from video
  const generateThumbnail = async (videoUrl: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video')
        video.crossOrigin = 'anonymous'
        video.src = videoUrl
        video.currentTime = 1 // Capture frame at 1 second

        video.addEventListener('loadeddata', () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              resolve(blob)
            }, 'image/jpeg', 0.8)
          } else {
            resolve(null)
          }
        })

        video.addEventListener('error', () => {
          resolve(null)
        })
      } catch (err) {
        console.error('Error generating thumbnail:', err)
        resolve(null)
      }
    })
  }

  // Upload to S3 via pre-signed URLs (bypasses Vercel's 5MB limit)
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
      const fileSize = blob.size

      // Generate thumbnail
      const thumbnailBlob = await generateThumbnail(recordedVideoUrl.value)

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
          duration: recordingTime.value,
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
      error.value = err.message || 'Failed to upload video'
      isUploading.value = false
      uploadProgress.value = 0
      return false
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
    shareToken.value = null
    shareableLink.value = null
    tabRecordingFallback.value = false
    displaySurfaceType.value = null
    isPositioning.value = false
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
    if (audioMixerContext) {
      audioMixerContext.close()
    }
    if (pipVideoElement) {
      if (document.pictureInPictureElement === pipVideoElement) {
        document.exitPictureInPicture().catch(err => console.log('PiP exit error:', err))
      }
      pipVideoElement.srcObject = null
      pipVideoElement = null
    }
  })

  return {
    // State
    isSupported,
    isRecording,
    isPaused,
    recordedVideoUrl,
    error,
    recordingTime,
    formattedTime,
    isUploading,
    uploadProgress,
    videoId,
    shareToken,
    shareableLink,
    countdown,
    isPreparingRecording,
    tabRecordingFallback,
    isPipActive,
    displaySurfaceType,
    isPositioning,

    // Recording settings
    recordingMode,
    showWebcam,
    includeAudio,

    // Streams
    webcamStream,

    // Methods
    startRecording,
    finalizeRecording,
    cancelPositioning,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleWebcam,
    uploadToS3,
    downloadRecording,
    resetRecording,
  }
}
