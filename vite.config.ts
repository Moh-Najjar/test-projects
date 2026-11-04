import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // Generates a self-signed certificate for HTTPS
  ],
  server: {
    port: 3000,
    host: true,
  },
})
  