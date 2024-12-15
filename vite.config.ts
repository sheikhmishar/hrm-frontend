import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  appType: 'spa',
  base: './',
  envPrefix: 'REACT_APP_',
  plugins: [react(), viteTsconfigPaths(), svgr({ include: '**/*.svg?react' })],
  server: { port: 3000 }
})
