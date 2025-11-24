import baseConfig from "../tailwind.config"
import type { Config } from "tailwindcss"

export default {
	...(baseConfig as Config),
	content: [
		"./index.html",
		"./src/**/*.{ts,tsx,js,jsx}",
	],
} satisfies Config
