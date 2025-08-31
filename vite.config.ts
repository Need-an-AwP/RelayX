import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react({
    babel: {
      plugins: [
        "babel-plugin-react-compiler",
      ],
    },
  }), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: [
        "**/app/**",
        "**/.vscode/**",
        "**/README.md",
        "**/tsNodeDir/**",
        "**/pion-webrtc-ts/**",
      ],
    },
  }
})
