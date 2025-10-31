<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup>
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>
