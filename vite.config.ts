import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  define: {
    // This allows the client-side code to access process.env.API_KEY
    // Safely fallback to empty string if undefined during build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  }
});