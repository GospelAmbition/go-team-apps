<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Dashboard</h1>
        <div class="header-actions">
          <span class="user-info">Welcome, {{ user?.display_name || user?.email }}</span>
          <NuxtLink to="/profile" class="profile-link">
            Profile
          </NuxtLink>
          <button class="theme-toggle outline" @click="toggleTheme" :data-theme="theme">
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
          <button class="logout-button" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <!-- Featured Actions -->
      <div class="featured-actions">
        <NuxtLink to="/record" class="action-card action-card-primary">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
          <div class="action-content">
            <h2>Create New Recording</h2>
            <p>Record your screen, webcam, or both in seconds</p>
          </div>
          <div class="action-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </NuxtLink>

        <NuxtLink to="/library" class="action-card action-card-secondary">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
              <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
              <line x1="8" y1="10" x2="16" y2="10"></line>
              <line x1="8" y1="14" x2="16" y2="14"></line>
            </svg>
          </div>
          <div class="action-content">
            <h2>View Library</h2>
            <p>Access all your recordings in one place</p>
          </div>
          <div class="action-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </NuxtLink>
      </div>

      <div class="dashboard-grid">
        <UCard>
          <template #header>
            <h3>Account Info</h3>
          </template>
          <div class="space-y-2">
            <p><strong>Name:</strong> {{ user?.display_name || 'Not set' }}</p>
            <p><strong>Email:</strong> {{ user?.email }}</p>
            <p><strong>Status:</strong> {{ user?.verified ? 'Verified' : 'Unverified' }}</p>
            <p v-if="user?.superadmin"><strong>Role:</strong> Super Admin</p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3>Quick Actions</h3>
          </template>
          <div class="space-y-3">
            <UButton to="/profile" block>View Profile</UButton>
            <UButton block variant="outline">Settings</UButton>
            <UButton block variant="outline">Help</UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3>Recent Activity</h3>
          </template>
          <p>No recent activity to display.</p>
        </UCard>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

const { theme, toggleTheme, initTheme } = useTheme()
const { logout, user } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

onMounted(() => {
  initTheme()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.dashboard-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  color: var(--text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.profile-link {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.profile-link:hover {
  background: var(--bg-hover);
}

.theme-toggle, .logout-button {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem !important;
}

.logout-button:hover {
  background: var(--bg-hover);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Featured Actions */
.featured-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.action-card-primary {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.95));
  color: white;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}

.action-card-primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.action-card-secondary {
  background: var(--bg-secondary);
  border-color: var(--border);
  color: var(--text);
}

.action-card-secondary:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px var(--shadow);
  border-color: var(--text);
}

[data-theme="dark"] .action-card-secondary {
  background: var(--bg-secondary);
}

.action-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
}

.action-card-secondary .action-icon {
  background: var(--bg-hover);
}

.action-content {
  flex: 1;
}

.action-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.action-card-primary .action-content h2 {
  color: white;
}

.action-card-secondary .action-content h2 {
  color: var(--text);
}

.action-content p {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.8;
}

.action-arrow {
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.3s;
}

.action-card:hover .action-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Nuxt UI Card overrides for dashboard */
:deep([class*="Card"]) {
  border-color: var(--border) !important;
}

[data-theme="dark"] :deep([class*="Card"]) {
  background-color: var(--bg-secondary) !important;
}

:deep([class*="Card"] h3) {
  color: var(--text);
  font-size: 1.25rem;
  margin: 0;
}

:deep([class*="Card"] p) {
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0.5rem 0;
}

:deep([class*="Card"] strong) {
  color: var(--text);
}

/* Outline button overrides */
:deep(button[class*="outline"]) {
  background: transparent !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

:deep(button[class*="outline"]:hover:not(:disabled)) {
  background: var(--bg-hover) !important;
}

/* Ensure proper spacing */
:deep(.space-y-3 > *) {
  margin-bottom: 0.75rem;
}

:deep(.space-y-3 > *:last-child) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .featured-actions {
    grid-template-columns: 1fr;
  }

  .action-card {
    flex-direction: column;
    text-align: center;
  }

  .action-content h2 {
    font-size: 1.25rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>