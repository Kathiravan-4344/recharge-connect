import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawTarget =
    env.VITE_BACKEND_TARGET ||
    (env.VITE_API_URL && env.VITE_API_URL.startsWith("http")
      ? env.VITE_API_URL.replace(/\/api\/?$/, "")
      : null) ||
    "http://127.0.0.1:5000";

  const apiTarget = rawTarget.replace("localhost", "127.0.0.1");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
