<template>
  <div class="library-page">
    <!-- Header -->
    <div class="header">
      <NuxtLink to="/dashboard" class="logo">Go Apps</NuxtLink>
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

    <div class="library-container">
      <div class="library-header">
        <h1>Your Recordings</h1>
        <UButton to="/record">
          <template #leading>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </template>
          New Recording
        </UButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <UIcon name="i-heroicons-arrow-path" class="loading-spinner" />
        <p>Loading recordings...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="videos.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <h2>No Recordings Yet</h2>
        <p>Create your first screen recording to get started.</p>
        <UButton to="/record" size="lg">
          <template #leading>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </template>
          Start Recording
        </UButton>
      </div>

      <!-- Video Grid -->
      <div v-else class="video-grid">
        <div v-for="video in videos" :key="video.id" class="video-card">
          <div class="video-thumbnail">
            <NuxtLink :to="`/watch/${video.shareToken}`" class="thumbnail-link">
              <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" :alt="video.title" class="thumbnail-image" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="play-icon">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </NuxtLink>
          </div>

          <div class="video-info">
            <div class="video-title-section">
              <input
                v-if="editingVideoId === video.id"
                v-model="editingTitle"
                @blur="saveTitle(video.id)"
                @keyup.enter="saveTitle(video.id)"
                @keyup.esc="cancelEdit"
                class="video-title-input"
                ref="titleInput"
                autofocus
              />
              <h3 v-else class="video-title">{{ video.title }}</h3>
              <button @click="startEditTitle(video)" class="edit-title-btn" :title="editingVideoId === video.id ? 'Save' : 'Edit title'">
                <svg v-if="editingVideoId === video.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>

            <div class="video-meta">
              <span class="video-date">{{ formatDate(video.createdAt) }}</span>
              <span class="video-duration">{{ formatDuration(video.duration) }}</span>
            </div>

            <div class="video-actions">
              <UButton :to="`/watch/${video.shareToken}`" size="sm" title="Watch" class="flex-1" square>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </UButton>
              <UButton @click="copyLink(video)" variant="outline" size="sm" :title="copied === video.id ? 'Copied!' : 'Copy Link'" class="flex-1" square>
                <svg v-if="copied !== video.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </UButton>
              <UButton @click="deleteVideo(video.id)" color="red" variant="outline" size="sm" title="Delete" class="flex-1" square>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div v-if="videos.length > 0" class="library-footer">
        <p class="video-count">{{ videos.length }} recording{{ videos.length === 1 ? '' : 's' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { theme, toggleTheme } = useTheme()

const videos = ref<any[]>([])
const copied = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const editingVideoId = ref<string | null>(null)
const editingTitle = ref('')

// Load videos from API
const loadVideos = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch('/api/videos', {
      method: 'GET',
      credentials: 'include',
    })

    videos.value = response.videos || []
  } catch (err: any) {
    console.error('Error loading videos:', err)
    error.value = err.data?.message || 'Failed to load videos'
    videos.value = []
  } finally {
    loading.value = false
  }
}

// Delete video
const deleteVideo = async (id: string) => {
  if (!confirm('Are you sure you want to delete this recording?')) {
    return
  }

  try {
    await $fetch(`/api/videos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    // Remove from local list
    videos.value = videos.value.filter(v => v.id !== id)
  } catch (err: any) {
    console.error('Error deleting video:', err)
    alert(err.data?.message || 'Failed to delete video')
  }
}

// Copy share link
const copyLink = async (video: any) => {
  try {
    const shareUrl = `${window.location.origin}/watch/${video.shareToken}`
    await navigator.clipboard.writeText(shareUrl)
    copied.value = video.id
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}

// Format duration
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Edit title
const startEditTitle = (video: any) => {
  if (editingVideoId.value === video.id) {
    // If already editing, save it
    saveTitle(video.id)
  } else {
    // Start editing
    editingVideoId.value = video.id
    editingTitle.value = video.title
  }
}

const saveTitle = async (videoId: string) => {
  if (!editingTitle.value || editingTitle.value.trim() === '') {
    cancelEdit()
    return
  }

  try {
    const response = await $fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        title: editingTitle.value.trim()
      }
    })

    // Update the video in the local list
    const video = videos.value.find(v => v.id === videoId)
    if (video) {
      video.title = editingTitle.value.trim()
    }

    editingVideoId.value = null
    editingTitle.value = ''
  } catch (err: any) {
    console.error('Error updating title:', err)
    alert(err.data?.message || 'Failed to update title')
    cancelEdit()
  }
}

const cancelEdit = () => {
  editingVideoId.value = null
  editingTitle.value = ''
}

// Load videos on mount
onMounted(() => {
  loadVideos()
})

// Update page title
useHead({
  title: 'Your Recordings - Go Apps',
})
</script>

<style scoped>
.library-page {
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.library-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.library-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: var(--ui-text);
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--ui-text-muted);
  font-size: 1.1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: var(--ui-text);
  opacity: 0.3;
  margin: 0 auto 2rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* Video Grid */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.video-card {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  background: var(--ui-border);
  overflow: hidden;
}

.thumbnail-link {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ui-bg-elevated), var(--ui-border));
  color: var(--ui-text);
  text-decoration: none;
  transition: background 0.2s;
}

.thumbnail-link:hover {
  background: linear-gradient(135deg, var(--ui-border), var(--ui-bg-elevated));
}

.thumbnail-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
  position: relative;
  z-index: 1;
}

.video-info {
  padding: 1rem;
}

.video-title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.video-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ui-text);
}

.video-title-input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--ui-text);
  background: var(--ui-bg);
  color: var(--ui-text);
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
}

.video-title-input:focus {
  border-color: var(--ui-text);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .video-title-input:focus {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.edit-title-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: var(--ui-text-muted);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.edit-title-btn:hover {
  color: var(--ui-text);
  background: var(--ui-bg);
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.video-duration {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.video-actions {
  display: flex;
  gap: 0.5rem;
}

.video-actions .flex-1 {
  flex: 1;
}

.video-actions :deep(button),
.video-actions :deep(a) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-actions :deep(svg) {
  margin: 0 auto;
}

/* Library Footer */
.library-footer {
  text-align: center;
  padding: 1rem;
  color: var(--ui-text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .library-container {
    padding: 1rem;
  }

  .library-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .library-header h1 {
    font-size: 1.5rem;
  }

  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>
