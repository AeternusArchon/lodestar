import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Must cover .jsx — Tasks 10, 11, and 12 add JSX test files, and a .js-only
  // glob would let `npm test` pass green while never running them.
  test: { environment: 'jsdom', include: ['tests/**/*.test.{js,jsx}'] },
})
