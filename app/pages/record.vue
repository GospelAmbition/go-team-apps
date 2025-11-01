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
        <div v-if="!isRecording && !recordedVideoUrl && countdown === 0 && !isPreparingRecording" class="start-recording-view">
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

          <UButton @click="handleStartRecording" size="xl" class="mt-4">
            <template #leading>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </template>
            Start Recording
          </UButton>
          <p class="hint">
            <span v-if="selectedMode === 'screen'">Record your entire screen, a specific window, or just a browser tab. Microphone audio will be included.</span>
            <span v-else-if="selectedMode === 'webcam'">Record yourself using your webcam with audio.</span>
            <span v-else>Record your screen with your webcam in picture-in-picture mode. Note: Webcam overlay will be disabled if you select a browser tab.</span>
          </p>

          <!-- Settings for Screen + Webcam mode -->
          <div v-if="selectedMode === 'both'" class="recording-settings">
            <h3>Webcam Settings</h3>

            <div class="setting-group">
              <label>Webcam Position</label>
              <div class="position-grid">
                <button
                  @click="webcamPosition = 'bottom-left'"
                  :class="['position-btn', { 'position-btn-active': webcamPosition === 'bottom-left' }]"
                  title="Bottom Left"
                >
                  <div class="position-indicator bl">
                    <video v-if="webcamStream" ref="webcamVideoRef" autoplay muted playsinline class="webcam-mini"></video>
                  </div>
                </button>
                <button
                  @click="webcamPosition = 'bottom-right'"
                  :class="['position-btn', { 'position-btn-active': webcamPosition === 'bottom-right' }]"
                  title="Bottom Right"
                >
                  <div class="position-indicator br">
                    <video v-if="webcamStream" autoplay muted playsinline class="webcam-mini"></video>
                  </div>
                </button>
                <button
                  @click="webcamPosition = 'top-left'"
                  :class="['position-btn', { 'position-btn-active': webcamPosition === 'top-left' }]"
                  title="Top Left"
                >
                  <div class="position-indicator tl">
                    <video v-if="webcamStream" autoplay muted playsinline class="webcam-mini"></video>
                  </div>
                </button>
                <button
                  @click="webcamPosition = 'top-right'"
                  :class="['position-btn', { 'position-btn-active': webcamPosition === 'top-right' }]"
                  title="Top Right"
                >
                  <div class="position-indicator tr">
                    <video v-if="webcamStream" autoplay muted playsinline class="webcam-mini"></video>
                  </div>
                </button>
              </div>
            </div>

            <div class="setting-group">
              <label>Webcam Size</label>
              <UFieldGroup orientation="horizontal" class="w-full">
                <UButton
                  @click="webcamSize = 'small'"
                  :variant="webcamSize === 'small' ? 'solid' : 'outline'"
                  block
                >
                  Small
                </UButton>
                <UButton
                  @click="webcamSize = 'medium'"
                  :variant="webcamSize === 'medium' ? 'solid' : 'outline'"
                  block
                >
                  Medium
                </UButton>
                <UButton
                  @click="webcamSize = 'large'"
                  :variant="webcamSize === 'large' ? 'solid' : 'outline'"
                  block
                >
                  Large
                </UButton>
              </UFieldGroup>
            </div>

            <div class="setting-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="includeMicrophone" />
                <span>Include Microphone Audio</span>
              </label>
            </div>
          </div>
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

        <!-- Recording In Progress -->
        <div v-else-if="isRecording" class="recording-view">
          <div class="recording-indicator">
            <div class="recording-pulse"></div>
            <span class="recording-text">RECORDING</span>
          </div>

          <div class="recording-time">{{ formattedTime }}</div>

          <!-- Tab Recording Fallback Notification -->
          <div v-if="tabRecordingFallback" class="tab-fallback-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Tab recording: webcam overlay disabled, using microphone audio instead.</span>
          </div>

          <p class="recording-message">
            <span v-if="recordingMode === 'screen'">Your screen is being recorded.</span>
            <span v-else-if="recordingMode === 'webcam'">Your webcam is being recorded.</span>
            <span v-else>Your screen and webcam are being recorded.</span>
          </p>

          <!-- Webcam Preview -->
          <div
            v-if="(recordingMode === 'both' || recordingMode === 'webcam') && showWebcam && webcamStream"
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

          <!-- Webcam Toggle for 'both' mode -->
          <div v-if="recordingMode === 'both'" class="webcam-controls">
            <UButton @click="toggleWebcam" variant="outline">
              <template #leading>
                <svg v-if="showWebcam" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </template>
              {{ showWebcam ? 'Hide' : 'Show' }} Webcam
            </UButton>
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
              Record Again
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
              Record Again
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecordingMode, WebcamPosition, WebcamSize } from '~/composables/useScreenRecorder'

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
  webcamPosition,
  webcamSize,
  showWebcam,
  includeMicrophone,
  countdown,
  isPreparingRecording,
  tabRecordingFallback,
  webcamStream,
  startRecording,
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
    // Set stream for all video elements that show the webcam
    const videoElements = document.querySelectorAll<HTMLVideoElement>('.webcam-mini, .webcam-preview')
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

// Start webcam preview when 'both' mode is selected
watch(selectedMode, async (mode) => {
  if (mode === 'both' || mode === 'webcam') {
    // Request webcam access for preview
    try {
      if (!webcamStream.value) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        webcamStream.value = stream
      }
    } catch (err) {
      console.error('Error accessing webcam for preview:', err)
    }
  } else {
    // Stop webcam stream when not in 'both' or 'webcam' mode
    if (webcamStream.value) {
      webcamStream.value.getTracks().forEach(track => track.stop())
      webcamStream.value = null
    }
  }
}, { immediate: true })

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
  startRecording(selectedMode.value)
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

/* Position Grid */
.position-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.position-btn {
  aspect-ratio: 16 / 9;
  padding: 0.5rem;
  border: 2px solid var(--ui-border);
  background: var(--ui-bg);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: visible;
}

.position-btn:hover {
  border-color: var(--ui-text);
}

.position-btn-active {
  border-color: rgba(0, 0, 0, 0.85);
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .position-btn-active {
  border-color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
}

.position-indicator {
  position: absolute;
  width: 25%;
  height: 25%;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.webcam-mini {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror the preview */
}

.position-indicator.tl {
  top: 8px;
  left: 8px;
}

.position-indicator.tr {
  top: 8px;
  right: 8px;
}

.position-indicator.bl {
  bottom: 8px;
  left: 8px;
}

.position-indicator.br {
  bottom: 8px;
  right: 8px;
}

.position-btn-active .position-indicator {
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5);
}

/* Size Buttons - using NuxtUI ButtonGroup now */

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

/* Responsive */
@media (max-width: 640px) {
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
