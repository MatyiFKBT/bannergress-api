import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',   // key: no node builtins, no browser polyfills injected
  target: 'es2020',
  dts: true,             // emits .d.ts and .d.cts
  sourcemap: true,
  clean: true,
  unbundle: true,        // one output file per source file — nice for a generated SDK
})
