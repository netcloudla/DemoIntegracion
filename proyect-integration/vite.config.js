import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  
  preview: {
    port: 8080,
    strictPort: true,
    allowedHosts: ['demo-integracion-frontend-fu6nhjuyia-ue.a.run.app']
  },
  
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    origin: "http://0.0.0.0:8080",
  },
});

