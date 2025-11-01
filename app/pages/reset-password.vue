<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()
const { theme, toggleTheme, initTheme } = useTheme()

const token = computed(() => route.query.token as string)

const state = reactive({
  password: '',
  confirmPassword: '',
  loading: false
})

const error = ref('')
const success = ref(false)
const invalidToken = ref(false)

// Validate token on mount and initialize theme
onMounted(() => {
  initTheme()
  if (!token.value) {
    invalidToken.value = true
  }
})

async function handleResetPassword() {
  error.value = ''

  // Validate passwords
  if (state.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (state.password !== state.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  state.loading = true

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: state.password,
        confirmPassword: state.confirmPassword
      }
    })

    success.value = true

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'An error occurred. Please try again.'
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Theme Toggle -->
      <div class="flex justify-end mb-4">
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

      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-black mb-2">Reset Password</h1>
        <p class="text-gray-600">Enter your new password</p>
      </div>

      <!-- Invalid Token View -->
      <UCard v-if="invalidToken" class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <div class="space-y-4">
          <UAlert
            color="red"
            variant="soft"
            title="Invalid Reset Link"
          />
          <p class="text-gray-600">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <UButton
            color="primary"
            size="lg"
            block
            @click="router.push('/login')"
          >
            Back to Login
          </UButton>
        </div>
      </UCard>

      <!-- Success View -->
      <UCard v-else-if="success" class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <div class="space-y-4">
          <UAlert
            color="green"
            variant="soft"
            title="Password Reset Successfully!"
          />
          <p class="text-gray-600">
            Your password has been reset. You can now log in with your new password.
          </p>
          <p class="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </UCard>

      <!-- Reset Form -->
      <UCard v-else class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <form @submit.prevent="handleResetPassword" class="space-y-6">
          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            @close="error = ''"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
          />

          <!-- Password Input -->
          <div class="space-y-2">
            <UFormField label="New Password" name="password" required>
              <UInput
                v-model="state.password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                size="lg"
                :disabled="state.loading"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Confirm Password Input -->
          <div class="space-y-2">
            <UFormField label="Confirm Password" name="confirmPassword" required>
              <UInput
                v-model="state.confirmPassword"
                type="password"
                placeholder="Confirm new password"
                size="lg"
                :disabled="state.loading"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="state.loading"
            :disabled="state.loading || !state.password || !state.confirmPassword"
          >
            Reset Password
          </UButton>

          <!-- Back to Login -->
          <div class="text-center">
            <button
              type="button"
              @click="router.push('/login')"
              class="text-sm text-gray-600 hover:text-black transition-colors"
              :disabled="state.loading"
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </UCard>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 mt-8">
        By resetting your password, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
</template>

<style scoped>
.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
}
</style>
