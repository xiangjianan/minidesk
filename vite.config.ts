import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  // LAN 模式（preview:lan）：自签 HTTPS + 监听全部网卡，供手机等同网设备真机访问。
  // 手机端加密（crypto.subtle）要求安全上下文，局域网裸 HTTP 会导致速记发送必败。
  plugins: [vue(), ...(process.env.MINI_DESK_LAN === "1" ? [basicSsl()] : []), ...(process.env.VITE_MINI_DESK_OFFLINE === "1" ? [{
    name: "offline-content-policy",
    transformIndexHtml: (html: string) => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; object-src 'none'" />`),
  }] : [])],
  build: {
    // Vite 8 runs on rolldown; the legacy `manualChunks` hook is a compatibility
    // shim that silently drops groups (the old vendor-vue rule never emitted a
    // chunk). `advancedChunks` groups are the supported way to pin vendor splits.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: "vendor-vue", test: /[\\/]node_modules[\\/](vue|@vue)[\\/]/ },
            { name: "vendor-naive", test: /[\\/]node_modules[\\/]naive-ui[\\/]/ },
            { name: "vendor-icons", test: /[\\/]node_modules[\\/](@vicons|lucide-vue-next)[\\/]/ },
            { name: "vendor-ui", test: /[\\/]node_modules[\\/](reka-ui|@vueuse)[\\/]/ },
            { name: "vendor", test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
