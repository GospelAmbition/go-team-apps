export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Check if user is authenticated by trying to fetch user info
  try {
    await $fetch('/api/auth/me')
  } catch {
    // Include the current path as redirect parameter
    const redirectUrl = to.fullPath
    return navigateTo(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  }
});