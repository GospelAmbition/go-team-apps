<template>
  <div class="recorder-page">
    <RecorderHeader />

    <RecorderPermissionWarnings
      :webcam-permission="webcamPermission"
      :microphone-permission="microphonePermission"
      @request-webcam="requestWebcamPermission"
      @request-microphone="requestMicrophonePermission"
    />

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
        <!-- Start Recording View -->
        <RecorderStartRecordingView
          v-if="!isRecording && !recordedVideoUrl && countdown === 0 && !isPreparingRecording && !isPositioning"
          v-model:selected-mode="selectedMode"
          v-model:include-audio="includeAudio"
          @start-recording="handleStartRecording"
        />

        <!-- Preparing Recording -->
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
        <RecorderCountdownView v-else-if="countdown > 0" :countdown="countdown" />

        <!-- Positioning View -->
        <RecorderPositioningView
          v-else-if="isPositioning"
          :is-pip-active="isPipActive"
          @finalize-recording="handleFinalizeRecording"
          @cancel-positioning="cancelPositioning"
        />

        <!-- Recording In Progress -->
        <RecorderRecordingView
          v-else-if="isRecording"
          :formatted-time="formattedTime"
          :recording-mode="recordingMode"
          :show-webcam="showWebcam"
          :webcam-stream="webcamStream"
          :is-paused="isPaused"
          @pause="pauseRecording"
          @resume="resumeRecording"
          @stop="stopRecording"
        />

        <!-- Uploading -->
        <RecorderUploadingView v-else-if="isUploading" :upload-progress="uploadProgress" />

        <!-- Upload Complete - Share Link -->
        <RecorderShareView
          v-else-if="shareableLink"
          :shareable-link="shareableLink"
          :share-token="shareToken"
          @reset-recording="resetRecording"
        />

        <!-- Recording Complete - Preview -->
        <RecorderPreviewView
          v-else-if="recordedVideoUrl"
          :recorded-video-url="recordedVideoUrl"
          @upload="uploadToS3"
          @download="downloadRecording"
          @reset="resetRecording"
        />
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

const {
  isSupported,
  isRecording,
  isPaused,
  recordedVideoUrl,
  error,
  formattedTime,
  isUploading,
  uploadProgress,
  shareToken,
  shareableLink,
  recordingMode,
  showWebcam,
  includeAudio,
  countdown,
  isPreparingRecording,
  isPipActive,
  isPositioning,
  webcamStream,
  startRecording,
  finalizeRecording,
  cancelPositioning,
  stopRecording,
  pauseRecording,
  resumeRecording,
  uploadToS3,
  downloadRecording,
  resetRecording,
} = useScreenRecorder()

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
  if (navigator.permissions) {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      webcamPermission.value = cameraPermission.state as 'granted' | 'denied' | 'prompt'

      cameraPermission.addEventListener('change', () => {
        webcamPermission.value = cameraPermission.state as 'granted' | 'denied' | 'prompt'
      })
    } catch (err) {
      webcamPermission.value = 'prompt'
    }

    try {
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      microphonePermission.value = micPermission.state as 'granted' | 'denied' | 'prompt'

      micPermission.addEventListener('change', () => {
        microphonePermission.value = micPermission.state as 'granted' | 'denied' | 'prompt'
      })
    } catch (err) {
      microphonePermission.value = 'prompt'
    }
  }
})

const handleStartRecording = () => {
  if (selectedMode.value === 'screen' || selectedMode.value === 'both') {
    startRecording(selectedMode.value, 'monitor')
  } else {
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

.recorder-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.recorder-content {
  text-align: center;
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

.description {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
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

/* Responsive */
@media (max-width: 640px) {
  .recorder-container {
    padding: 2rem 1rem;
  }
}
</style>
