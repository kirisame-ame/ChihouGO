import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/random": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/guess": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/guess-kanji": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/giveup": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/img": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
