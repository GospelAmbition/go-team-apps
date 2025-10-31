<template>
  <div class="watch-page">
    <!-- Theme Toggle -->
    <div class="header">
      <NuxtLink to="/record" class="logo">Loomsly</NuxtLink>
      <button class="theme-toggle-btn" @click="toggleTheme" title="Toggle theme">
        {{ theme === 'light' ? '🌙' : '☀️' }}
      </button>
    </div>

    <div class="watch-container">
      <!-- Loading -->
      <div v-if="loading" class="loading-view">
        <div class="spinner"></div>
        <p>Loading video...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-card">
        <h2>Error Loading Video</h2>
        <p>{{ error }}</p>
        <UButton to="/record" size="lg">
          <template #leading>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </template>
          Create Your Own Recording
        </UButton>
      </div>

      <!-- Video Player -->
      <div v-else-if="videoUrl" class="player-view">
        <div class="video-container">
          <video
            ref="videoPlayer"
            :src="videoUrl"
            controls
            autoplay
            class="video-player"
          ></video>
        </div>

        <div class="video-actions">
          <UButton to="/record" size="lg">
            <template #leading>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </template>
            Create Your Own
          </UButton>
          <UButton to="/library" size="lg" variant="outline">
            <template #leading>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="10" x2="16" y2="10"></line>
                <line x1="8" y1="14" x2="16" y2="14"></line>
              </svg>
            </template>
            View Library
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { theme, toggleTheme } = useTheme()

const videoId = computed(() => route.params.id)
const loading = ref(true)
const error = ref<string | null>(null)
const videoUrl = ref<string | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)

// Load video on mount
onMounted(async () => {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch(`/api/videos/${videoId.value}`)

    if (!response || !response.videoUrl) {
      throw new Error('Video not found')
    }

    videoUrl.value = response.videoUrl
  } catch (err: any) {
    console.error('Error loading video:', err)
    error.value = err.message || 'Failed to load video'
  } finally {
    loading.value = false
  }
})

// Update page title
useHead({
  title: `Watch Video - Loomsly`,
})
</script>

<style scoped>
.watch-page {
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

.theme-toggle-btn {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  color: var(--ui-text);
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-btn:hover {
  background: var(--ui-border);
}

.watch-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Loading View */
.loading-view {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ui-border);
  border-top: 4px solid var(--ui-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-view p {
  color: var(--ui-text-muted);
  font-size: 1.1rem;
}

/* Error Card */
.error-card {
  background: var(--ui-bg-elevated);
  border: 2px solid #dc2626;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.error-card h2 {
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-card p {
  color: var(--ui-text-muted);
  margin-bottom: 1.5rem;
}

/* Player View */
.player-view {
  text-align: center;
}

.video-container {
  border-radius: 0.5rem;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.video-player {
  width: 100%;
  max-height: 80vh;
  display: block;
}

.video-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 640px) {
  .watch-container {
    padding: 1rem;
  }

  .video-actions {
    flex-direction: column;
  }
}
</style>
