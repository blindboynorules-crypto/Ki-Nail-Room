import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  // SECURITY UPDATE:
  // Removed "define: { process.env.API_KEY: ... }"
  // Reason: Exposing API keys in client-side code is a security risk.
  // The frontend now calls a secure backend API (/api/analyze-nail) instead.
});