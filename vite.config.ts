import { defineConfig } from "vite"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [tailwindcss(), tsconfigPaths()],
	esbuild: {
		jsx: "automatic",
	},
	server: {
		port: 5174,
		fs: {
			// Allow importing shared assets (styles/components) from the parent app folder
			allow: [path.resolve(__dirname, "."), path.resolve(__dirname, "..")],
		},
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "src"),
			react: path.resolve(__dirname, "../node_modules/react"),
			"react-dom": path.resolve(__dirname, "../node_modules/react-dom"),
		},
		dedupe: ["react", "react-dom"],
	},
	optimizeDeps: {
		include: ["react", "react-dom"],
	},
	css: {
		postcss: path.resolve(__dirname, "postcss.config.ts"),
	},
})
