import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // 提高chunk大小警告限制
    chunkSizeWarningLimit: 1000,

    // 生产环境压缩
    minify: 'esbuild',

    // 启用CSS代码分割
    cssCodeSplit: true,

    // 构建优化
    rollupOptions: {
      output: {
        // 代码分割策略
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Element Plus单独打包
          if (id.includes('element-plus')) return 'vendor-element-plus'

          // 图标单独打包
          if (id.includes('@element-plus/icons-vue') || id.includes('@iconify')) return 'vendor-icons'

          // Vue核心库
          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vendor-vue'
          }

          // HTTP库
          if (id.includes('axios')) return 'vendor-http'

          // ECharts单独打包(如果使用)
          if (id.includes('echarts')) return 'vendor-echarts'

          // 其他依赖
          return 'vendor-misc'
        },

        // 文件命名优化
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },

    // 启用源码映射(开发环境)
    sourcemap: false
  },
  esbuild: {
    drop: ['console', 'debugger'],
    pure: ['console.log']
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:48080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
