<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const { theme, toggleTheme, initTheme } = useTheme()

// Initialize theme on mount
onMounted(() => {
  initTheme()
})

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Forgot password state
const view = ref<'login' | 'reset'>('login')
const resetEmail = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref(false)
const sentToEmail = ref('')

// Check for verification status in query params
onMounted(() => {
  const verified = route.query.verified as string
  if (verified === 'success') {
    successMessage.value = 'Email verified successfully! You can now sign in.'
  } else if (verified === 'already') {
    successMessage.value = 'Your email is already verified. Please sign in.'
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const result = await login(state.email, state.password)

    if (!result.success) {
      error.value = result.message || 'Login failed. Please check your credentials.'
    }
    // On success, useAuth composable will handle navigation
  } catch (err: any) {
    error.value = err.data?.message || 'An error occurred during login. Please try again.'
  } finally {
    loading.value = false
  }
}

const redirectToRegister = () => {
  const redirect = route.query.redirect as string
  if (redirect) {
    router.push(`/register?redirect=${encodeURIComponent(redirect)}`)
  } else {
    router.push('/register')
  }
}

async function handleForgotPassword() {
  resetError.value = ''
  resetLoading.value = true

  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: resetEmail.value
      }
    })

    resetSuccess.value = true
    sentToEmail.value = resetEmail.value
    resetEmail.value = ''
  } catch (err: any) {
    resetError.value = err.data?.message || 'An error occurred. Please try again.'
  } finally {
    resetLoading.value = false
  }
}

function switchToLogin() {
  view.value = 'login'
  resetSuccess.value = false
  resetError.value = ''
  sentToEmail.value = ''
}

function switchToReset() {
  view.value = 'reset'
  error.value = ''
  successMessage.value = ''
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
        <h1 class="text-4xl font-bold text-black mb-2">
          {{ view === 'login' ? 'Welcome Back' : 'Reset Password' }}
        </h1>
        <p class="text-gray-600">
          {{ view === 'login' ? 'Sign in to your account' : 'Enter your email to receive reset instructions' }}
        </p>
      </div>

      <!-- Login View -->
      <UCard v-if="view === 'login'" class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Success Alert -->
          <UAlert
            v-if="successMessage"
            color="green"
            variant="soft"
            :title="successMessage"
            @close="successMessage = ''"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
          />

          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            @close="error = ''"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
          />

          <!-- Email Input -->
          <div class="space-y-2">
            <UFormField label="Email" name="email" required>
              <UInput
                v-model="state.email"
                type="email"
                placeholder="you@example.com"
                size="lg"
                :disabled="loading"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <UFormField label="Password" name="password" required>
              <UInput
                v-model="state.password"
                type="password"
                placeholder="Enter your password"
                size="lg"
                :disabled="loading"
                autocomplete="current-password"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Forgot Password Link -->
          <div class="text-right">
            <button
              type="button"
              @click="switchToReset"
              class="text-sm ghost text-gray-600 hover:text-black transition-colors"
              :disabled="loading"
            >
              Forgot Password?
            </button>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="loading"
            :disabled="loading || !state.email || !state.password"
          >
            Sign In
          </UButton>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          <!-- Register Link -->
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            block
            @click="redirectToRegister"
            :disabled="loading"
          >
            Create Account
          </UButton>
        </form>
      </UCard>

      <!-- Forgot Password View -->
      <UCard v-else class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <form @submit.prevent="handleForgotPassword" class="space-y-6">
          <!-- Success Message -->
          <div v-if="resetSuccess" class="space-y-4">
            <UAlert
              color="green"
              variant="soft"
              title="Email Sent!"
              :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
              @close="resetSuccess = false"
            />
            <p class="text-gray-600">
              If an account with <strong>{{ sentToEmail }}</strong> exists, you will receive password reset instructions shortly.
            </p>
            <p class="text-sm text-gray-500">
              Check your email inbox and spam folder.
            </p>
          </div>

          <!-- Reset Form -->
          <div v-else class="space-y-6">
            <!-- Error Alert -->
            <UAlert
              v-if="resetError"
              color="red"
              variant="soft"
              :title="resetError"
              @close="resetError = ''"
              :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
            />

            <!-- Email Input -->
            <div class="space-y-2">
              <UFormField label="Email" name="email" required>
                <UInput
                  v-model="resetEmail"
                  type="email"
                  placeholder="you@example.com"
                  size="lg"
                  :disabled="resetLoading"
                  autocomplete="email"
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
              :loading="resetLoading"
              :disabled="resetLoading || !resetEmail"
            >
              Send Reset Link
            </UButton>
          </div>

          <!-- Back to Login -->
          <div class="text-center">
            <button
              type="button"
              @click="switchToLogin"
              class="text-sm text-gray-600 hover:text-black transition-colors"
              :disabled="resetLoading"
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </UCard>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 mt-8">
        By signing in, you agree to our Terms of Service and Privacy Policy
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
