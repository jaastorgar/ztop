import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 🚀 Expone el servidor a tu red local para entrar al juego desde tu celular real
    port: 5173,
  }
})