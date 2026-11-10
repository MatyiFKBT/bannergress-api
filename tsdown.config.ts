import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  platform: 'neutral',   // key: no node builtins, no browser polyfills injected
  target: 'es2020',
  dts: true,             // emits .d.ts next to each module
  sourcemap: false,      // consumers debug through their own sourcemaps; maps doubled the tarball
  clean: true,
  unbundle: true,        // one output file per source file — best tree-shaking for consumers
})
