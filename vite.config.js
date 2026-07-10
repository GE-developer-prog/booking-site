import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        services: 'services.html',
        booking: 'booking.html',
        confirmation: 'confirmation.html',
        about: 'about.html',
        dashboard: 'dashboard.html',
        dashboardlogin: 'dashboard-login.html'
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
})