<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useAuth()
const { theme, toggleTheme, initTheme } = useTheme()
const route = useRoute()

// Initialize theme and check for email change status in query params
onMounted(() => {
  initTheme()

  const emailChangeStatus = route.query.email_change as string
  if (emailChangeStatus) {
    switch (emailChangeStatus) {
      case 'success':
        emailSuccess.value = 'Email address successfully changed! You can now log in with your new email.'
        break
      case 'invalid_token':
        emailError.value = 'Invalid or expired verification link'
        break
      case 'no_pending':
        emailError.value = 'No pending email change found'
        break
      case 'email_taken':
        emailError.value = 'The new email address is already in use'
        break
    }
  }
})

// State for name change
const nameState = reactive({
  display_name: user.value?.display_name || ''
})
const nameLoading = ref(false)
const nameError = ref('')
const nameSuccess = ref('')

// State for email change
const emailState = reactive({
  new_email: '',
  current_password: ''
})
const emailLoading = ref(false)
const emailError = ref('')
const emailSuccess = ref('')

const canSubmitEmail = computed(() => {
  return emailState.new_email.trim() &&
    emailState.current_password &&
    !emailLoading.value &&
    emailState.new_email !== user.value?.email
})

// State for password change
const passwordState = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Watch user changes to update name field
watch(user, (newUser) => {
  if (newUser) {
    nameState.display_name = newUser.display_name
  }
})

// Password validation
const passwordMatch = computed(() => {
  return passwordState.new_password === passwordState.confirm_password
})

const passwordStrength = computed(() => {
  const password = passwordState.new_password
  if (password.length === 0) return { strength: 0, label: '', color: 'gray' }
  if (password.length < 8) return { strength: 25, label: 'Weak', color: 'red' }
  if (password.length < 12) return { strength: 50, label: 'Fair', color: 'yellow' }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return { strength: 50, label: 'Fair', color: 'yellow' }
  }
  return { strength: 100, label: 'Strong', color: 'green' }
})

const canSubmitPassword = computed(() => {
  return passwordState.current_password &&
    passwordState.new_password.length >= 8 &&
    passwordMatch.value &&
    !passwordLoading.value
})

// Handle name update
async function handleNameUpdate() {
  nameError.value = ''
  nameSuccess.value = ''

  if (!nameState.display_name.trim()) {
    nameError.value = 'Display name is required'
    return
  }

  nameLoading.value = true

  try {
    const response = await $fetch('/api/profile/name', {
      method: 'PATCH',
      body: {
        display_name: nameState.display_name.trim()
      }
    })

    nameSuccess.value = 'Display name updated successfully'

    // Update user in auth composable
    if (user.value) {
      user.value.display_name = nameState.display_name.trim()
    }
  } catch (err: any) {
    nameError.value = err.data?.statusMessage || 'Failed to update display name'
  } finally {
    nameLoading.value = false
  }
}

// Handle email change
async function handleEmailChange() {
  emailError.value = ''
  emailSuccess.value = ''

  if (!canSubmitEmail.value) {
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailState.new_email)) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  emailLoading.value = true

  try {
    await $fetch('/api/profile/email', {
      method: 'POST',
      body: {
        new_email: emailState.new_email.trim(),
        current_password: emailState.current_password
      }
    })

    emailSuccess.value = 'Verification email sent! Please check your new email address to confirm the change.'

    // Reset form
    emailState.new_email = ''
    emailState.current_password = ''
  } catch (err: any) {
    emailError.value = err.data?.statusMessage || 'Failed to request email change'
  } finally {
    emailLoading.value = false
  }
}

// Handle password change
async function handlePasswordChange() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!canSubmitPassword.value) {
    return
  }

  passwordLoading.value = true

  try {
    await $fetch('/api/profile/password', {
      method: 'PATCH',
      body: {
        current_password: passwordState.current_password,
        new_password: passwordState.new_password
      }
    })

    passwordSuccess.value = 'Password changed successfully'

    // Reset form
    passwordState.current_password = ''
    passwordState.new_password = ''
    passwordState.confirm_password = ''
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage || 'Failed to change password'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen profile-page">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold profile-title">Profile Settings</h1>
          <div class="flex items-center gap-2">
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
            <UButton
              to="/dashboard"
              variant="ghost"
              icon="i-heroicons-arrow-left"
            >
              Back to Dashboard
            </UButton>
          </div>
        </div>

        <!-- Account Info -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Account Information</h2>
          </template>

          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">Email:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">{{ user?.email }}</span>
            </div>
            <div>
              <span class="font-medium">Account created:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">
                {{ new Date(user?.created).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Change Display Name -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Change Display Name</h2>
          </template>

          <form @submit.prevent="handleNameUpdate" class="space-y-4">
            <UFormField label="Display Name">
              <UInput
                v-model="nameState.display_name"
                type="text"
                size="lg"
                :disabled="nameLoading"
                placeholder="Enter your display name"
              />
            </UFormField>

            <UAlert
              v-if="nameError"
              color="red"
              :title="nameError"
            />

            <UAlert
              v-if="nameSuccess"
              color="green"
              :title="nameSuccess"
            />

            <UButton
              type="submit"
              size="lg"
              :loading="nameLoading"
              :disabled="!nameState.display_name.trim() || nameLoading"
            >
              Update Name
            </UButton>
          </form>
        </UCard>

        <!-- Change Email -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Change Email Address</h2>
          </template>

          <form @submit.prevent="handleEmailChange" class="space-y-4">
            <div class="text-sm text-gray-600 mb-4">
              <p>Current email: <strong>{{ user?.email }}</strong></p>
              <p class="mt-2">A verification link will be sent to your new email address.</p>
            </div>

            <UFormField label="New Email Address">
              <UInput
                v-model="emailState.new_email"
                type="email"
                size="lg"
                :disabled="emailLoading"
                placeholder="Enter new email address"
                autocomplete="email"
              />
            </UFormField>

            <UFormField label="Current Password">
              <UInput
                v-model="emailState.current_password"
                type="password"
                size="lg"
                :disabled="emailLoading"
                placeholder="Enter your current password"
                autocomplete="current-password"
              />
            </UFormField>

            <UAlert
              v-if="emailError"
              color="red"
              :title="emailError"
            />

            <UAlert
              v-if="emailSuccess"
              color="green"
              :title="emailSuccess"
            />

            <UButton
              type="submit"
              size="lg"
              :loading="emailLoading"
              :disabled="!canSubmitEmail"
            >
              Send Verification Email
            </UButton>
          </form>
        </UCard>

        <!-- Change Password -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Change Password</h2>
          </template>

          <form @submit.prevent="handlePasswordChange" class="space-y-4">
            <UFormField label="Current Password">
              <UInput
                v-model="passwordState.current_password"
                type="password"
                size="lg"
                :disabled="passwordLoading"
                placeholder="Enter current password"
                autocomplete="current-password"
              />
            </UFormField>

            <UFormField label="New Password">
              <UInput
                v-model="passwordState.new_password"
                type="password"
                size="lg"
                :disabled="passwordLoading"
                placeholder="Enter new password (min 8 characters)"
                autocomplete="new-password"
              />
            </UFormField>

            <!-- Password Strength Indicator -->
            <div v-if="passwordState.new_password" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Password Strength:</span>
                <span :class="{
                  'text-red-600': passwordStrength.color === 'red',
                  'text-yellow-600': passwordStrength.color === 'yellow',
                  'text-green-600': passwordStrength.color === 'green'
                }">
                  {{ passwordStrength.label }}
                </span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300"
                  :class="{
                    'bg-red-500': passwordStrength.color === 'red',
                    'bg-yellow-500': passwordStrength.color === 'yellow',
                    'bg-green-500': passwordStrength.color === 'green'
                  }"
                  :style="{ width: passwordStrength.strength + '%' }"
                ></div>
              </div>
            </div>

            <UFormField label="Confirm New Password">
              <UInput
                v-model="passwordState.confirm_password"
                type="password"
                size="lg"
                :disabled="passwordLoading"
                placeholder="Confirm new password"
                autocomplete="new-password"
              />
            </UFormField>

            <!-- Password Match Indicator -->
            <div v-if="passwordState.confirm_password" class="text-sm">
              <span v-if="passwordMatch" class="text-green-600">
                ✓ Passwords match
              </span>
              <span v-else class="text-red-600">
                ✗ Passwords do not match
              </span>
            </div>

            <UAlert
              v-if="passwordError"
              color="red"
              :title="passwordError"
            />

            <UAlert
              v-if="passwordSuccess"
              color="green"
              :title="passwordSuccess"
            />

            <UButton
              type="submit"
              size="lg"
              :loading="passwordLoading"
              :disabled="!canSubmitPassword"
            >
              Change Password
            </UButton>
          </form>
        </UCard>

        <!-- Sign Out -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">Sign Out</h2>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Sign out of your account on this device.
            </p>

            <UButton
              color="red"
              variant="outline"
              size="lg"
              @click="logout"
            >
              Sign Out
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  background-color: var(--bg);
  color: var(--text);
}

.profile-title {
  color: var(--text);
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

/* Profile-specific overrides for Nuxt UI components */
:deep(button[class*="ghost"]) {
  color: var(--text) !important;
}

:deep(button[class*="ghost"]:hover) {
  background-color: var(--bg-hover) !important;
}

:deep([class*="Card"]) {
  border-color: var(--border) !important;
}

[data-theme="dark"] :deep([class*="Card"]) {
  background-color: var(--bg-secondary) !important;
}
</style>
