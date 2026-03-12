/**
 * 前端性能优化工具
 */

/**
 * 图片懒加载指令
 * 使用方式: v-lazy="imageUrl"
 */
export const lazyLoadDirective = {
  mounted(el: HTMLImageElement, binding: { value: string }) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = binding.value
            img.classList.add('loaded')
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px' // 提前50px加载
      }
    )
    observer.observe(el)
  }
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间(ms)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param delay 延迟时间(ms)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 虚拟滚动 Hook
 * 用于大列表渲染优化
 */
export function useVirtualScroll(options: {
  itemHeight: number
  containerHeight: number
  buffer?: number
}) {
  const { itemHeight, containerHeight, buffer = 5 } = options

  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const totalBuffer = buffer * 2

  return {
    visibleCount,
    totalBuffer,
    getVisibleRange: (scrollTop: number, totalCount: number) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
      const endIndex = Math.min(totalCount, startIndex + visibleCount + totalBuffer)
      return { startIndex, endIndex }
    },
    getOffsetY: (startIndex: number) => startIndex * itemHeight
  }
}

/**
 * 请求缓存装饰器
 * 缓存GET请求结果,避免重复请求
 */
const requestCache = new Map<string, { data: any; timestamp: number }>()

export function cacheRequest(ttl: number = 60000) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`
      const cached = requestCache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data
      }

      const result = await originalMethod.apply(this, args)
      requestCache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    }

    return descriptor
  }
}

/**
 * 清除请求缓存
 */
export function clearRequestCache() {
  requestCache.clear()
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>()

  /**
   * 开始计时
   */
  static start(label: string) {
    this.marks.set(label, performance.now())
  }

  /**
   * 结束计时并输出
   */
  static end(label: string) {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`Performance mark "${label}" not found`)
      return
    }

    const duration = performance.now() - startTime
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    this.marks.delete(label)
    return duration
  }

  /**
   * 监控组件渲染时间
   */
  static measureComponent(componentName: string) {
    return {
      onBeforeMount: () => this.start(`${componentName}-mount`),
      onMounted: () => this.end(`${componentName}-mount`),
      onBeforeUpdate: () => this.start(`${componentName}-update`),
      onUpdated: () => this.end(`${componentName}-update`)
    }
  }
}

/**
 * 资源预加载
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage))
}

/**
 * 动态导入组件(代码分割)
 */
export function lazyLoadComponent(loader: () => Promise<any>) {
  return {
    component: loader,
    delay: 200,
    timeout: 10000
  }
}
