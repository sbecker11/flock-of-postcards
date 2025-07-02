<template>
  <Suspense>
    <template #default>
      <AppContent />
    </template>
    <template #fallback>
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading Your Experience...</p>
      </div>
    </template>
  </Suspense>
</template>

<script>
import AppContent from '@/modules/components/AppContent.vue';

export default {
  name: 'App',
  components: {
    AppContent
  }
};
</script>

<style>
.loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #1a1a1a;
  color: white;
  font-family: Arial, sans-serif;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #333;
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>