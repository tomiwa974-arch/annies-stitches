import { defineConfig } from 'vite'
import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  // HTTP/backend tests share the app but should not claim the user's HMR port.
  server:
    process.env.ANNIES_TEST_RUN === '1' || process.argv.includes('test')
      ? { hmr: false, ws: false }
      : undefined,
  plugins: [
    inertia({ ssr: { enabled: false } }),
    react(),
    adonisjs({ entrypoints: ['inertia/app/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      'page-flip/engine': `${getDirname(import.meta.url)}/node_modules/page-flip/src/PageFlip.ts`,
      'page-flip/render': `${getDirname(import.meta.url)}/node_modules/page-flip/src/Render/Render.ts`,
      '~/': `${getDirname(import.meta.url)}/inertia/`,
    },
  },
})
