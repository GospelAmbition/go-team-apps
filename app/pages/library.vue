<template>
  <div class="library-page">
    <!-- Header -->
    <div class="header">
      <NuxtLink to="/record" class="logo">Loomsly</NuxtLink>
      <button class="theme-toggle-btn" @click="toggleTheme" title="Toggle theme">
        {{ theme === 'light' ? '🌙' : '☀️' }}
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

      <!-- Empty State -->
      <div v-if="videos.length === 0" class="empty-state">
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
            <NuxtLink :to="`/watch/${video.id}`" class="thumbnail-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </NuxtLink>
          </div>

          <div class="video-info">
            <div class="video-meta">
              <span class="video-date">{{ formatDate(video.createdAt) }}</span>
              <span class="video-duration">{{ formatDuration(video.duration) }}</span>
            </div>

            <div class="video-actions">
              <NuxtLink :to="`/watch/${video.id}`" class="action-btn" title="Watch">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </NuxtLink>
              <button @click="copyLink(video)" class="action-btn" :title="copied === video.id ? 'Copied!' : 'Copy Link'">
                <svg v-if="copied !== video.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button @click="deleteVideo(video.id)" class="action-btn action-btn-danger" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
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

// Load videos from localStorage
const loadVideos = () => {
  try {
    const stored = localStorage.getItem('loomsly_videos')
    videos.value = stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error('Error loading videos:', err)
    videos.value = []
  }
}

// Delete video
const deleteVideo = (id: string) => {
  if (!confirm('Are you sure you want to delete this recording?')) {
    return
  }

  try {
    videos.value = videos.value.filter(v => v.id !== id)
    localStorage.setItem('loomsly_videos', JSON.stringify(videos.value))
  } catch (err) {
    console.error('Error deleting video:', err)
  }
}

// Copy share link
const copyLink = async (video: any) => {
  try {
    await navigator.clipboard.writeText(video.shareLink)
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

// Load videos on mount
onMounted(() => {
  loadVideos()
})

// Update page title
useHead({
  title: 'Your Recordings - Loomsly',
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

.thumbnail-link svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.video-info {
  padding: 1rem;
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

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 1px solid var(--ui-border);
  background: transparent;
  color: var(--ui-text);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--ui-bg);
  border-color: var(--ui-text);
}

.action-btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
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
