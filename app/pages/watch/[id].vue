<template>
  <div class="watch-page">
    <!-- Header -->
    <div class="header">
      <NuxtLink to="/dashboard" class="logo">Go Apps</NuxtLink>
      <div class="header-actions">
        <NuxtLink v-if="user" to="/library" class="library-link">
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
        <div class="video-title-section">
          <input
            v-if="isEditing"
            v-model="editTitle"
            @blur="saveTitle"
            @keyup.enter="saveTitle"
            @keyup.esc="cancelEdit"
            class="video-title-input"
            autofocus
          />
          <h1 v-else class="video-title">{{ videoTitle }}</h1>
          <button v-if="isOwner" @click="startEdit" class="edit-title-btn" :title="isEditing ? 'Save' : 'Edit title'">
            <svg v-if="isEditing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        <div v-if="isOwner" class="view-count">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>{{ viewCount }} {{ viewCount === 1 ? 'view' : 'views' }}</span>
        </div>

        <div class="video-container">
          <video
            ref="videoPlayer"
            :src="videoUrl"
            controls
            autoplay
            class="video-player"
          ></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { theme, toggleTheme } = useTheme()

// Check if user is logged in
const { data: user } = await useFetch('/api/auth/me', {
  credentials: 'include',
})

const videoId = computed(() => route.params.id)
const loading = ref(true)
const error = ref<string | null>(null)
const videoUrl = ref<string | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const videoTitle = ref<string>('')
const isOwner = ref(false)
const isEditing = ref(false)
const editTitle = ref('')
const videoDbId = ref<string>('')
const viewCount = ref<number>(0)

// Check if this video has been viewed recently (within 12 hours)
const hasRecentView = (videoId: string): boolean => {
  if (typeof window === 'undefined') return false

  const storageKey = `video_view_${videoId}`
  const lastViewTime = localStorage.getItem(storageKey)

  if (!lastViewTime) return false

  const twelveHoursInMs = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
  const timeSinceView = Date.now() - parseInt(lastViewTime, 10)

  return timeSinceView < twelveHoursInMs
}

// Mark video as viewed in localStorage
const markAsViewed = (videoId: string) => {
  if (typeof window === 'undefined') return

  const storageKey = `video_view_${videoId}`
  localStorage.setItem(storageKey, Date.now().toString())
}

// Load video on mount
onMounted(async () => {
  try {
    loading.value = true
    error.value = null

    // Check if we should count this view
    const shouldCountView = !hasRecentView(videoId.value as string)

    // Always fetch video data
    const response = await $fetch(`/api/videos/${videoId.value}`)

    if (!response || !response.videoUrl) {
      throw new Error('Video not found')
    }

    videoUrl.value = response.videoUrl
    videoTitle.value = response.title || 'Untitled Video'
    isOwner.value = response.isOwner || false
    videoDbId.value = response.videoId
    viewCount.value = response.viewCount || 0

    // Only increment view count on first visit within 12 hours
    if (shouldCountView) {
      try {
        await $fetch(`/api/videos/${videoId.value}/view`, {
          method: 'POST',
        })
        markAsViewed(videoId.value as string)
      } catch (viewErr) {
        // Silently fail if view tracking fails - don't block video playback
        console.warn('Failed to track view:', viewErr)
      }
    }
  } catch (err: any) {
    console.error('Error loading video:', err)
    error.value = err.message || 'Failed to load video'
  } finally {
    loading.value = false
  }
})

// Edit title functions
const startEdit = () => {
  if (isEditing.value) {
    saveTitle()
  } else {
    isEditing.value = true
    editTitle.value = videoTitle.value
  }
}

const saveTitle = async () => {
  if (!editTitle.value || editTitle.value.trim() === '') {
    cancelEdit()
    return
  }

  try {
    await $fetch(`/api/videos/${videoDbId.value}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        title: editTitle.value.trim()
      }
    })

    videoTitle.value = editTitle.value.trim()
    isEditing.value = false
    editTitle.value = ''
  } catch (err: any) {
    console.error('Error updating title:', err)
    alert(err.data?.message || 'Failed to update title')
    cancelEdit()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = ''
}

// Update page title
useHead({
  title: `Watch Video - Go Apps`,
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

.video-title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.video-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: var(--ui-text);
}

.video-title-input {
  flex: 1;
  max-width: 600px;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--ui-text);
  background: var(--ui-bg);
  color: var(--ui-text);
  border-radius: 0.375rem;
  font-size: 1.75rem;
  font-weight: 600;
  outline: none;
  text-align: center;
}

.video-title-input:focus {
  border-color: var(--ui-text);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .video-title-input:focus {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.edit-title-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--ui-text-muted);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.edit-title-btn:hover {
  color: var(--ui-text);
  background: var(--ui-bg-elevated);
}

.view-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.view-count svg {
  opacity: 0.7;
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
  min-height: 500px;
  max-height: 80vh;
  display: block;
}

/* Responsive */
@media (max-width: 640px) {
  .watch-container {
    padding: 1rem;
  }

  .video-title {
    font-size: 1.25rem;
  }

  .video-title-input {
    font-size: 1.25rem;
    max-width: 100%;
  }

  .video-title-section {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
