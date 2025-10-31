export const useAuth = () => {
  const user = useState('auth.user', () => null as any)
  
  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      }) as { success: boolean; user?: any }
      
      if (response.success) {
        user.value = response.user
        
        // Check for redirect parameter in URL
        const route = useRoute()
        const redirectTo = route.query.redirect as string
        
        if (redirectTo && redirectTo.startsWith('/')) {
          // Only allow internal redirects (starting with /)
          await navigateTo(redirectTo)
        } else {
          await navigateTo('/')
        }
        
        return { success: true }
      }
      
      return { success: false, message: 'Login failed' }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.message || 'An error occurred during login' 
      }
    }
  }
  
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      await navigateTo('/login')
    } catch {
      // Even if the server request fails, clear local state
      user.value = null
      await navigateTo('/login')
    }
  }
  
  const register = async (email: string, password: string, display_name: string) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, display_name }
      }) as { success: boolean; message?: string; requiresVerification?: boolean }
      
      return response
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.message || 'Registration failed' 
      }
    }
  }
  
  const checkAuth = async () => {
    try {
      const response = await $fetch('/api/auth/me') as { user: any }
      user.value = response.user
      return response.user
    } catch {
      user.value = null
      return null
    }
  }

  const isLoggedIn = computed(() => !!user.value)

  return {
    user: readonly(user),
    login,
    logout,
    register,
    checkAuth,
    isLoggedIn
  }
} 