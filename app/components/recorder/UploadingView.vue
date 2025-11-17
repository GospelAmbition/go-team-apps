<template>
  <div class="uploading-view">
    <h2>Uploading Your Recording...</h2>
    <p class="description">
      Please wait while we save your recording to the cloud.
    </p>

    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
      <div class="progress-text">{{ uploadProgress }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  uploadProgress: number
}>()
</script>

<style scoped>
.uploading-view {
  padding: 2rem;
}

.uploading-view h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  text-align: center;
}

.description {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.progress-container {
  margin: 2rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--ui-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
