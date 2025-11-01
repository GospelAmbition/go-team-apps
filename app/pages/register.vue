<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()
const { register } = useAuth()
const { theme, toggleTheme, initTheme } = useTheme()

// Initialize theme on mount
onMounted(() => {
  initTheme()
})

const state = reactive({
  display_name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const passwordMatch = computed(() => {
  if (!state.confirmPassword) return true
  return state.password === state.confirmPassword
})

const passwordStrength = computed(() => {
  const password = state.password
  if (!password) return { strength: 0, label: '', color: 'gray' }

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const colors = ['red', 'orange', 'yellow', 'green', 'emerald']

  return {
    strength: (strength / 5) * 100,
    label: labels[strength - 1] || 'Weak',
    color: colors[strength - 1] || 'red'
  }
})

async function handleRegister() {
  error.value = ''

  // Validation
  if (state.display_name.length < 2) {
    error.value = 'Display name must be at least 2 characters long'
    return
  }

  if (state.password.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  if (state.password !== state.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const result = await register(state.email, state.password, state.display_name)

    if (result.success) {
      success.value = true
      // Wait 3 seconds then redirect to login
      setTimeout(() => {
        const redirect = route.query.redirect as string
        if (redirect) {
          router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
        } else {
          router.push('/login')
        }
      }, 3000)
    } else {
      error.value = result.message || 'Registration failed. Please try again.'
    }
  } catch (err: any) {
    error.value = err.data?.message || 'An error occurred during registration. Please try again.'
  } finally {
    loading.value = false
  }
}

const redirectToLogin = () => {
  const redirect = route.query.redirect as string
  if (redirect) {
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
  } else {
    router.push('/login')
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
        <h1 class="text-4xl font-bold text-black mb-2">Create Account</h1>
        <p class="text-gray-600">Join us today</p>
      </div>

      <!-- Register Card -->
      <UCard class="border border-gray-200 shadow-lg" :ui="{ body: 'p-6 sm:p-8' }">
        <!-- Success Message -->
        <div v-if="success" class="space-y-4">
          <UAlert
            color="green"
            variant="soft"
            title="Registration Successful!"
            description="Please check your email to verify your account. Redirecting to login..."
            :ui="{ icon: 'i-lucide-check-circle' }"
          />
        </div>

        <!-- Registration Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            @close="error = ''"
            :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'ghost' }"
          />

          <!-- Display Name Input -->
          <div class="space-y-2">
            <UFormField label="Display Name" name="display_name" required>
              <UInput
                v-model="state.display_name"
                type="text"
                placeholder="Your name"
                size="lg"
                :disabled="loading"
                autocomplete="name"
                class="w-full"
              />
            </UFormField>
          </div>

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
                placeholder="Create a strong password"
                size="lg"
                :disabled="loading"
                autocomplete="new-password"
                class="w-full"
              />

              <!-- Password Strength Indicator -->
              <div v-if="state.password" class="mt-2 space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600">Password strength:</span>
                  <span :class="`font-medium text-${passwordStrength.color}-600`">
                    {{ passwordStrength.label }}
                  </span>
                </div>
                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    :class="`h-full bg-${passwordStrength.color}-500 transition-all duration-300`"
                    :style="{ width: `${passwordStrength.strength}%` }"
                  ></div>
                </div>
              </div>
            </UFormField>
          </div>

          <!-- Confirm Password Input -->
          <div class="space-y-2">
            <UFormField label="Confirm Password" name="confirmPassword" required>
              <UInput
                v-model="state.confirmPassword"
                type="password"
                placeholder="Confirm your password"
                size="lg"
                :disabled="loading"
                autocomplete="new-password"
                :ui="{ base: 'px-3 py-2' }"
                :color="!passwordMatch ? 'red' : undefined"
                class="w-full"
              />
              <p v-if="!passwordMatch" class="text-xs text-red-600 mt-1">
                Passwords do not match
              </p>
            </UFormField>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="loading"
            :disabled="loading || !state.email || !state.password || !state.display_name || !passwordMatch"
          >
            Create Account
          </UButton>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          <!-- Login Link -->
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            block
            @click="redirectToLogin"
            :disabled="loading"
          >
            Sign In
          </UButton>
        </form>
      </UCard>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 mt-8">
        By creating an account, you agree to our Terms of Service and Privacy Policy
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
