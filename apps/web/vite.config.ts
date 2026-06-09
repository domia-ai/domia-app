import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
	server: {
		port: 3000,
	},
	resolve: {
		tsconfigPaths: true,
		dedupe: ["react", "react-dom"],
	},
	ssr: {
		external: ["better-sqlite3", "@domia-app/db"],
	},
	optimizeDeps: {
		exclude: ["better-sqlite3"],
	},
	plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
})
