import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.API_KEY),
      "process.env.ATTENDANCE_API_URL": JSON.stringify(env.ATTENDANCE_API_URL),
      "process.env.ADMIN_PASSWORD": JSON.stringify(env.ADMIN_PASSWORD)
    },
    server: {
      proxy: {
        '/api/log': {
          target: 'https://script.google.com',
          changeOrigin: true,
          secure: true,
          rewrite: () => {
            // Parse url from env to get path
            try {
              const u = new URL(env.ATTENDANCE_API_URL);
              return u.pathname + u.search;
            } catch (e) {
              return "";
            }
          }
        }
      }
    }
  };
});
