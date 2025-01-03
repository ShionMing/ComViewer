import {vitePluginForArco} from "@arco-plugins/vite-react";
import react from "@vitejs/plugin-react";
import {resolve} from "path";
import {defineConfig} from "vite";
import MockDevServerPlugin from "vite-plugin-mock-dev-server";
import WindiCSS from "vite-plugin-windicss";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        WindiCSS(),
        vitePluginForArco(),
        MockDevServerPlugin(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    server: {
        proxy: {
            "/api": "http://127.0.0.1:4173",
        },
    },
    css: {
        modules: {
            localsConvention: "camelCase",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("/node_modules/")) {
                        const module = id.split("/node_modules/")[1].split("/")[1];
                        const map: Record<string, string> = {
                            // "antd": "antd",
                            "@ant-design": "ant",
                            "@arco-design": "arco",
                            "ahooks": "ahooks",
                            "lodash": "lodash",
                            "d3": "d3",
                            "lucide": "lucide",
                        };
                        for (const key of Object.keys(map)) {
                            if (module.startsWith(key)) {
                                return map[key];
                            }
                        }
                    }
                },
            },
        },
    },
});
