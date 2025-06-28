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

// import { loadEnv } from 'vite';

// https://vitejs.dev/config/
// UserConfigFn
// export default ({ mode }: { mode: string }) => {
//   process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
//   const envPrefix = process.env.NODE_ENV;

//   return defineConfig({
//     plugins: [react()],
//     envDir: `./env/${envPrefix}`, // .env always + 
//   });
// };