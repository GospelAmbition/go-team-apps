<template>
  <div class="recorder-page">
    <!-- Header -->
    <div class="header">
      <NuxtLink to="/dashboard" class="logo">Go Apps</NuxtLink>
      <div class="header-actions">
        <NuxtLink to="/library" class="library-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
            <line x1="8" y1="10" x2="16" y2="10"></line>
            <line x1="8" y1="14" x2="16" y2="14"></line>
          </svg>
          Library
        </NuxtLink>
        <button class="theme-toggle-btn outline" @click="toggleTheme" :data-theme="theme" title="Toggle theme">
          <svg v-if="theme === 'light'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Permission Warnings -->
    <div v-if="webcamPermission !== 'granted' || microphonePermission !== 'granted'" class="permissions-warnings">
      <div v-if="webcamPermission !== 'granted'" class="permission-warning webcam-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div class="warning-content">
          <h3>Webcam Access</h3>
          <p>{{ webcamPermission === 'denied' ? 'Please enable webcam access in your browser settings to record with your camera.' : 'Click the button to grant webcam access for recording.' }}</p>
        </div>
        <UButton @click="requestWebcamPermission" variant="outline" color="red">
          Enable Webcam
        </UButton>
      </div>

      <div v-if="microphonePermission !== 'granted'" class="permission-warning microphone-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div class="warning-content">
          <h3>Microphone Access</h3>
          <p>{{ microphonePermission === 'denied' ? 'Please enable microphone access in your browser settings to record audio.' : 'Click the button to grant microphone access for recording.' }}</p>
        </div>
        <UButton @click="requestMicrophonePermission" variant="outline" color="red">
          Enable Microphone
        </UButton>
      </div>
    </div>

    <div class="recorder-container">
      <!-- Browser Not Supported -->
      <div v-if="!isSupported" class="error-card">
        <h2>Browser Not Supported</h2>
        <p>
          Your browser doesn't support screen recording. Please use Chrome, Edge, or Firefox.
        </p>
      </div>

      <!-- Error Message -->
      <div v-else-if="error" class="error-card">
        <h2>Recording Error</h2>
        <p>{{ error }}</p>
        <UButton @click="error = null" variant="outline">
          Try Again
        </UButton>
      </div>

      <!-- Recording Interface -->
      <div v-else class="recorder-content">
        <!-- Not Recording - Show Start Button -->
        <div v-if="!isRecording && !recordedVideoUrl && countdown === 0 && !isPreparingRecording && !isPositioning" class="start-recording-view">
          <div class="icon-container">
            <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <h2>Create a Recording</h2>
          <p class="description">
            Choose what you want to record
          </p>

          <!-- Mode Selection -->
          <div class="mode-selection">
            <UButton
              @click="selectedMode = 'both'"
              :variant="selectedMode === 'both' ? 'solid' : 'outline'"
              size="xl"
              block
              class="mode-btn"
            >
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                  <polyline points="23 7 16 12 23 17"></polyline>
                </svg>
              </template>
              Screen + Webcam
            </UButton>
            <UButton
              @click="selectedMode = 'screen'"
              :variant="selectedMode === 'screen' ? 'solid' : 'outline'"
              size="xl"
              block
              class="mode-btn"
            >
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </template>
              Screen Only
            </UButton>
            <UButton
              @click="selectedMode = 'webcam'"
              :variant="selectedMode === 'webcam' ? 'solid' : 'outline'"
              size="xl"
              block
              class="mode-btn"
            >
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </template>
              Webcam Only
            </UButton>
          </div>

          <!-- Audio Settings -->
          <div class="recording-settings">
            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="includeAudio" />
                <span>Include Microphone Audio</span>
              </label>
            </div>
          </div>

          <UButton @click="handleStartRecording" size="xl" class="mt-4">
            <template #leading>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </template>
            Start Recording
          </UButton>
          <p class="hint">
            <span v-if="selectedMode === 'screen'">Record your entire screen, a specific window, or just a browser tab.</span>
            <span v-else-if="selectedMode === 'webcam'">Record yourself using your webcam with audio.</span>
            <span v-else>Record your screen with your webcam overlay in the bottom-right corner.</span>
          </p>
        </div>

        <!-- Preparing Recording - Loading State -->
        <div v-else-if="isPreparingRecording" class="loading-view">
          <div class="spinner-container">
            <div class="spinner"></div>
          </div>
          <h2>Preparing Recording...</h2>
          <p class="description">
            Setting up your streams and getting everything ready
          </p>
        </div>

        <!-- Countdown -->
        <div v-else-if="countdown > 0" class="countdown-view">
          <div class="countdown-number">{{ countdown }}</div>
          <p class="countdown-text">Get ready...</p>
        </div>

        <!-- Positioning Step (for monitor + both mode) -->
        <div v-else-if="isPositioning" class="positioning-view">
          <div class="step-indicator">
            <div class="step-number">Step 2: Position Webcam</div>
          </div>

          <h2>Position Your Webcam</h2>
          <p class="description">
            <span v-if="isPipActive">
              A Picture-in-Picture window is now showing your webcam. Drag it to your desired location on the screen, then click "Start Recording" below.
            </span>
            <span v-else>
              Your webcam is ready. Position it where you want it to appear in the final recording.
            </span>
          </p>

          <div class="positioning-instructions">
            <div class="instruction-card">
              <div class="instruction-icon">1</div>
              <div class="instruction-text">
                <strong>Drag the PiP window (your webcam)</strong> to your desired screen
              </div>
            </div>
            <div class="instruction-card">
              <div class="instruction-icon">2</div>
              <div class="instruction-text">
                <strong>Resize if needed</strong> using the browser's PiP controls
              </div>
            </div>
            <div class="instruction-card">
              <div class="instruction-icon">3</div>
              <div class="instruction-text">
                <strong>Click "Start Recording"</strong> when you're ready
              </div>
            </div>
          </div>

          <div v-if="isPipActive" class="pip-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            The webcam window will be visible in your final recording wherever you position it.
          </div>

          <div class="action-buttons">
            <UButton @click="handleFinalizeRecording" size="xl" color="green">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </template>
              Start Recording
            </UButton>
            <UButton @click="cancelPositioning" size="xl" variant="outline">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </template>
              Cancel
            </UButton>
          </div>
        </div>

        <!-- Recording In Progress -->
        <div v-else-if="isRecording" class="recording-view">
          <div class="recording-indicator">
            <div class="recording-pulse"></div>
            <span class="recording-text">RECORDING</span>
          </div>

          <div class="recording-time">{{ formattedTime }}</div>

          <p class="recording-message">
            <span v-if="recordingMode === 'screen'">Your screen is being recorded.</span>
            <span v-else-if="recordingMode === 'webcam'">Your webcam is being recorded.</span>
            <span v-else>Your screen and webcam are being recorded.</span>
          </p>

          <!-- Webcam Preview (only for webcam-only mode) -->
          <div
            v-if="recordingMode === 'webcam' && showWebcam && webcamStream"
            class="webcam-preview-container"
          >
            <video
              ref="webcamVideoRef"
              autoplay
              muted
              playsinline
              :class="['webcam-preview', `position-${webcamPosition}`, `size-${webcamSize}`]"
            ></video>
          </div>

          <div class="recording-controls">
            <UButton @click="isPaused ? resumeRecording() : pauseRecording()" size="xl" variant="outline">
              <template #leading>
                <svg v-if="isPaused" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </template>
              {{ isPaused ? 'Resume' : 'Pause' }}
            </UButton>
            <UButton @click="stopRecording" color="red" size="xl">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="6" y="6" width="12" height="12"></rect>
                </svg>
              </template>
              Stop Recording
            </UButton>
          </div>

          <p class="hint">
            You can also stop recording by clicking "Stop sharing" in your browser's sharing indicator.
          </p>
        </div>

        <!-- Uploading -->
        <div v-else-if="isUploading" class="uploading-view">
          <h2>Uploading Your Recording...</h2>
          <p class="description">
            Please wait while we save your recording to the cloud.
          </p>

          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
            <div class="progress-text">{{ uploadProgress }}%</div>
          </div>
        </div>

        <!-- Upload Complete - Show Share Link -->
        <div v-else-if="shareableLink" class="share-view">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2>Video Uploaded Successfully!</h2>
          <p class="description">
            Your recording has been saved. Share the link below with anyone you want.
          </p>

          <div class="share-link-container">
            <input
              :value="shareableLink"
              readonly
              class="share-link-input"
              @click="selectShareLink"
            />
            <UButton @click="copyShareLink">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </template>
              {{ copied ? 'Copied!' : 'Copy Link' }}
            </UButton>
          </div>

          <div class="action-buttons">
            <UButton :to="`/watch/${shareToken}`">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </template>
              Watch Video
            </UButton>
            <UButton to="/library" variant="outline">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                  <line x1="8" y1="10" x2="16" y2="10"></line>
                  <line x1="8" y1="14" x2="16" y2="14"></line>
                </svg>
              </template>
              View Library
            </UButton>
            <UButton @click="resetRecording" variant="outline">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              </template>
              New Recording
            </UButton>
          </div>
        </div>

        <!-- Recording Complete - Show Preview -->
        <div v-else-if="recordedVideoUrl" class="preview-view">
          <h2>Recording Complete!</h2>
          <p class="description">
            Your recording is ready. Preview it below and upload to share or download locally.
          </p>

          <div class="video-preview">
            <video
              :src="recordedVideoUrl"
              controls
              class="preview-video"
            ></video>
          </div>

          <div class="action-buttons">
            <UButton @click="uploadToS3">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </template>
              Upload & Share
            </UButton>
            <UButton @click="downloadRecording" variant="outline">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </template>
              Download Only
            </UButton>
            <UButton @click="resetRecording" variant="outline">
              <template #leading>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <polyline points="1 4 1 10 7 10"></polyline>
                <polyline points="23 20 23 14 17 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              </template>
              New Recording
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordingMode } from '~/composables/useScreenRecorder'

// Require authentication
const { data: user } = await useFetch('/api/auth/me', {
  credentials: 'include',
})

// Redirect to login if not authenticated
if (!user.value) {
  navigateTo('/login')
}

const { theme, toggleTheme } = useTheme()
const {
  isSupported,
  isRecording,
  isPaused,
  recordedVideoUrl,
  error,
  formattedTime,
  isUploading,
  uploadProgress,
  videoId,
  shareToken,
  shareableLink,
  recordingMode,
  showWebcam,
  includeAudio,
  countdown,
  isPreparingRecording,
  tabRecordingFallback,
  isPipActive,
  displaySurfaceType,
  isPositioning,
  webcamStream,
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
} = useScreenRecorder()

const webcamVideoRef = ref<HTMLVideoElement | null>(null)

// Setup webcam video element when stream is available
watchEffect(() => {
  if (webcamStream.value) {
    // Set stream for webcam preview during recording
    const videoElements = document.querySelectorAll<HTMLVideoElement>('.webcam-preview')
    videoElements.forEach(video => {
      if (video && !video.srcObject) {
        video.srcObject = webcamStream.value
        video.play().catch(err => {
          console.error('Error playing webcam video:', err)
        })
      }
    })

    // Also set for the main recording preview
    if (webcamVideoRef.value && !webcamVideoRef.value.srcObject) {
      webcamVideoRef.value.srcObject = webcamStream.value
      webcamVideoRef.value.play().catch(err => {
        console.error('Error playing webcam video:', err)
      })
    }
  }
})

const copied = ref(false)
const selectedMode = ref<RecordingMode>('both')

// Permission states
const webcamPermission = ref<'granted' | 'denied' | 'prompt' | 'checking'>('prompt')
const microphonePermission = ref<'granted' | 'denied' | 'prompt' | 'checking'>('prompt')

// Request webcam permission
const requestWebcamPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    webcamPermission.value = 'granted'
    stream.getTracks().forEach(track => track.stop())
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      webcamPermission.value = 'denied'
    } else {
      webcamPermission.value = 'prompt'
    }
  }
}

// Request microphone permission
const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    microphonePermission.value = 'granted'
    stream.getTracks().forEach(track => track.stop())
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      microphonePermission.value = 'denied'
    } else {
      microphonePermission.value = 'prompt'
    }
  }
}

// Check permissions on mount (without prompting)
onMounted(async () => {
  // Try to check permission status without prompting using Permissions API
  if (navigator.permissions) {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      webcamPermission.value = cameraPermission.state as 'granted' | 'denied' | 'prompt'

      cameraPermission.addEventListener('change', () => {
        webcamPermission.value = cameraPermission.state as 'granted' | 'denied' | 'prompt'
      })
    } catch (err) {
      // Permissions API not supported or query failed
      webcamPermission.value = 'prompt'
    }

    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      microphonePermission.value = micPermission.state as 'granted' | 'denied' | 'prompt'

      micPermission.addEventListener('change', () => {
        microphonePermission.value = micPermission.state as 'granted' | 'denied' | 'prompt'
      })
    } catch (err) {
      // Permissions API not supported or query failed
      microphonePermission.value = 'prompt'
    }
  }
})

// Note: Webcam stream will be requested when user starts recording, not on page load

const copyShareLink = async () => {
  if (!shareableLink.value) return

  try {
    await navigator.clipboard.writeText(shareableLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const selectShareLink = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
}

const handleStartRecording = () => {
  // Default to 'monitor' (entire screen) for screen/both modes
  if (selectedMode.value === 'screen' || selectedMode.value === 'both') {
    startRecording(selectedMode.value, 'monitor')
  } else {
    // For webcam only, no display surface needed
    startRecording(selectedMode.value)
  }
}

const handleFinalizeRecording = async () => {
  await finalizeRecording()
}

// Cleanup webcam stream on unmount
onUnmounted(() => {
  if (webcamStream.value && !isRecording.value) {
    webcamStream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.recorder-page {
  min-height: 100vh;
  background: var(--ui-bg);
  color: var(--ui-text);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--ui-border);
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--ui-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.library-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  color: var(--ui-text);
  border-radius: 0.25rem;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.library-link:hover {
  background: var(--ui-border);
  transform: translateY(-1px);
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.recorder-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.recorder-content {
  text-align: center;
}

/* Start Recording View */
.start-recording-view {
  padding: 2rem;
}

.icon-container {
  margin-bottom: 2rem;
}

.record-icon {
  width: 80px;
  height: 80px;
  color: var(--ui-text);
  opacity: 0.7;
  margin: 0 auto;
}

.start-recording-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.description {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hint {
  font-size: 0.9rem;
  color: var(--ui-text-muted);
  margin-top: 1rem;
}

/* Keep some button spacing */
.action-buttons :deep(button),
.action-buttons :deep(a) {
  margin: 0 !important;
}

/* Recording View */
.recording-view {
  padding: 2rem;
}

.recording-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tab-fallback-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem auto;
  max-width: 500px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 0.5rem;
  color: rgb(251, 191, 36);
  font-size: 0.9rem;
}

.tab-fallback-notice svg {
  flex-shrink: 0;
}

.pip-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem auto;
  max-width: 600px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 0.5rem;
  color: rgb(34, 197, 94);
  font-size: 0.9rem;
}

.pip-notice svg {
  flex-shrink: 0;
}

.recording-pulse {
  width: 12px;
  height: 12px;
  background: #dc2626;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.recording-text {
  font-weight: 600;
  font-size: 1rem;
  color: #dc2626;
  letter-spacing: 0.05em;
}

.recording-time {
  font-size: 3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 1.5rem;
}

.recording-message {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
}

.recording-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

/* Countdown View */
.countdown-view {
  padding: 4rem 2rem;
  text-align: center;
}

.countdown-number {
  font-size: 8rem;
  font-weight: 700;
  color: var(--ui-text);
  animation: countdownPulse 1s ease-in-out;
  line-height: 1;
}

@keyframes countdownPulse {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.countdown-text {
  font-size: 1.5rem;
  color: var(--ui-text-muted);
  margin-top: 2rem;
}

/* Positioning View */
.positioning-view {
  padding: 2rem;
}

.positioning-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.step-indicator {
  margin-bottom: 1.5rem;
}

.step-number {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ui-text-muted);
}

.positioning-instructions {
  max-width: 600px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.instruction-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  text-align: left;
}

.instruction-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: rgba(59, 130, 246, 0.1);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(59, 130, 246);
}

.instruction-text {
  flex: 1;
  font-size: 0.95rem;
  color: var(--ui-text);
}

.instruction-text strong {
  font-weight: 600;
  color: var(--ui-text);
}

/* Loading View */
.loading-view {
  padding: 4rem 2rem;
  text-align: center;
}

.loading-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.spinner-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--ui-border);
  border-top-color: var(--ui-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Preview View */
.preview-view {
  padding: 2rem;
}

.preview-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.video-preview {
  margin: 2rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-video {
  width: 100%;
  max-height: 500px;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Error Card */
.error-card {
  background: var(--ui-bg-elevated);
  border: 2px solid #dc2626;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
}

.error-card h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-card p {
  color: var(--ui-text-muted);
  margin-bottom: 1.5rem;
}

/* Uploading View */
.uploading-view {
  padding: 2rem;
}

.uploading-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.progress-container {
  margin: 2rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--ui-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Share View */
.share-view {
  padding: 2rem;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  background: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.success-icon svg {
  width: 48px;
  height: 48px;
  stroke-width: 3;
}

.share-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.share-link-container {
  display: flex;
  gap: 1rem;
  max-width: 700px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
}

.share-link-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.25rem;
  background: var(--ui-bg);
  color: var(--ui-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.share-link-input:focus {
  outline: 2px solid var(--ui-text);
  outline-offset: 2px;
}

/* Mode Selection */
.mode-selection {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2rem auto;
  max-width: 700px;
}

/* Recording Settings */
.recording-settings {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
}

.recording-settings h3 {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group > label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--ui-text-muted);
}

/* Checkbox Label */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem !important;
  font-weight: normal !important;
  color: var(--ui-text) !important;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Webcam Controls */
.webcam-controls {
  margin-bottom: 1.5rem;
}

/* Webcam Preview */
.webcam-preview-container {
  position: relative;
  max-width: 800px;
  margin: 2rem auto;
  aspect-ratio: 16 / 9;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  overflow: visible;
}

.webcam-preview {
  position: absolute;
  border-radius: 0.5rem;
  border: 3px solid var(--ui-bg-elevated);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  object-fit: cover;
  background: #000;
  z-index: 10;
  transform: scaleX(-1); /* Mirror the webcam */
}

/* Position classes */
.webcam-preview.position-top-left {
  top: 20px;
  left: 20px;
}

.webcam-preview.position-top-right {
  top: 20px;
  right: 20px;
}

.webcam-preview.position-bottom-left {
  bottom: 20px;
  left: 20px;
}

.webcam-preview.position-bottom-right {
  bottom: 20px;
  right: 20px;
}

/* Size classes */
.webcam-preview.size-small {
  width: 15%;
  aspect-ratio: 4 / 3;
}

.webcam-preview.size-medium {
  width: 25%;
  aspect-ratio: 4 / 3;
}

.webcam-preview.size-large {
  width: 35%;
  aspect-ratio: 4 / 3;
}

/* Permission Warnings */
.permissions-warnings {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem 2rem 0;
}

.permission-warning {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border: 2px solid #dc2626;
  border-radius: 0.5rem;
  color: #dc2626;
}

.permission-warning svg {
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.warning-content p {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

.permission-warning :deep(button) {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 640px) {
  .permissions-warnings {
    padding: 1rem 1rem 0;
  }

  .permission-warning {
    flex-wrap: wrap;
    padding: 1rem;
    gap: 0.75rem;
  }

  .permission-warning svg {
    width: 20px;
    height: 20px;
  }

  .warning-content h3 {
    font-size: 1rem;
  }

  .warning-content p {
    font-size: 0.875rem;
  }

  .permission-warning :deep(button) {
    width: 100%;
  }

  .recorder-container {
    padding: 2rem 1rem;
  }

  .start-recording-view h2,
  .preview-view h2,
  .uploading-view h2,
  .share-view h2 {
    font-size: 1.5rem;
  }

  .recording-time {
    font-size: 2.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .share-link-container {
    flex-direction: column;
  }

  .share-link-input {
    width: 100%;
  }

  .mode-selection {
    grid-template-columns: 1fr;
  }

  /* Webcam preview adjustments for mobile */
  .webcam-preview.size-small {
    width: 25%;
  }

  .webcam-preview.size-medium {
    width: 35%;
  }

  .webcam-preview.size-large {
    width: 45%;
  }

  .webcam-preview.position-top-left,
  .webcam-preview.position-top-right,
  .webcam-preview.position-bottom-left,
  .webcam-preview.position-bottom-right {
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
  }

  .webcam-preview.position-top-left {
    top: 10px;
    left: 10px;
  }

  .webcam-preview.position-top-right {
    top: 10px;
    right: 10px;
  }

  .webcam-preview.position-bottom-left {
    bottom: 10px;
    left: 10px;
  }

  .webcam-preview.position-bottom-right {
    bottom: 10px;
    right: 10px;
  }
}
</style>
