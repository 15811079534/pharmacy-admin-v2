<template>
  <div class="virtual-list" @scroll="handleScroll" ref="containerRef">
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="item in visibleData"
        :key="item[itemKey]"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  data: any[]
  itemHeight: number
  itemKey?: string
  buffer?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemKey: 'id',
  buffer: 5
})

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

// 容器高度
const containerHeight = ref(600)

// 总高度
const totalHeight = computed(() => props.data.length * props.itemHeight)

// 可见数量
const visibleCount = computed(() => Math.ceil(containerHeight.value / props.itemHeight))

// 开始索引
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
})

// 结束索引
const endIndex = computed(() => {
  return Math.min(props.data.length, startIndex.value + visibleCount.value + props.buffer * 2)
})

// 可见数据
const visibleData = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value)
})

// 偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight)

// 滚动处理
const handleScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
})
</script>

<style scoped>
.virtual-list {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-list-item {
  box-sizing: border-box;
}
</style>
