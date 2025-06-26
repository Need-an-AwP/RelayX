import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server:{
    watch: {
      ignored: [
        "**/TURN_on_Tailscale/**",
        "**/app/**",
        "**/.vscode/**",
        "**/tsNodeDir/**",
      ],
    },
  }
})
