import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/http/server.ts'],
  outDir: 'build/src',
  format: ['esm'],
  target: ['es2022'],
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    '.sql': 'copy',
    '.json': 'copy',
  },
  publicDir: 'src/database/migrations',
  bundle: true,
})