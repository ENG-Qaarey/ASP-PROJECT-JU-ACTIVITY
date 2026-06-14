import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const componentTagger = () => ({
  name: "component-tagger",
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Allow ngrok hostnames for local development
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok.app',
      'localhost',
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5281",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:5281",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
