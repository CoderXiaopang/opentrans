import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Bundle translationWorker as a separate CJS chunk so it lands in out/main/
        input: {
          index: 'src/main/index.js',
          translationWorker: 'src/main/translationWorker.js'
        },
        output: {
          format: 'cjs'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
