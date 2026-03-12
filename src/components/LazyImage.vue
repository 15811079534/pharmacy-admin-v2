<template>
  <div ref="containerRef" class="lazy-image" :class="{ loaded: isLoaded }">
    <img
      v-if="isLoaded"
      :src="src"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-else class="lazy-image-placeholder">
      <el-icon class="loading-icon"><Loading /></el-icon>
    </div>
    <div v-if="error" class="lazy-image-error">
      <el-icon><Picture /></el-icon>
      <span>加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading, Picture } from '@element-plus/icons-vue'

interface Props {
  src: string
  alt?: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  threshold: 0.01
})

const isLoaded = ref(false)
const error = ref(false)
const containerRef = ref<HTMLDivElement>()

let observer: IntersectionObserver | null = null

const handleLoad = () => {
  isLoaded.value = true
  error.value = false
}

const handleError = () => {
  error.value = true
}

const loadImage = () => {
  const img = new Image()
  img.onload = handleLoad
  img.onerror = handleError
  img.src = props.src
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage()
          if (observer) {
            observer.disconnect()
          }
        }
      })
    },
    {
      threshold: props.threshold,
      rootMargin: '50px'
    }
  )

  const container = containerRef.value
  if (container) {
    observer.observe(container)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f5f7fa;
}

.lazy-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.lazy-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
}

.loading-icon {
  font-size: 24px;
  color: #909399;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.lazy-image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.lazy-image-error .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.lazy-image.loaded {
  background-color: transparent;
}
</style>
