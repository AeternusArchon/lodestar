import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site under /<repo>/, so built asset URLs
  // must carry that prefix or index.html loads and nothing else does. Local
  // dev and tests keep '/'. A custom domain (served at the root) would set
  // this back to '/'.
  base: process.env.GITHUB_ACTIONS ? '/lodestar/' : '/',
  // Must cover .jsx — Tasks 10, 11, and 12 add JSX test files, and a .js-only
  // glob would let `npm test` pass green while never running them.
  //
  // globals: true exposes `afterEach` as a global, which is what
  // @testing-library/react's automatic post-test cleanup checks for (see its
  // dist/index.js). Without it, nothing unmounts the previous test's render
  // between tests in the same file, and later assertions see every prior
  // render's markup still in the document.
  test: { environment: 'jsdom', include: ['tests/**/*.test.{js,jsx}'], globals: true },
})
