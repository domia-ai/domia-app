import { defineConfig, globalIgnores } from "eslint/config"
import js from "@eslint/js"
import tseslint from "typescript-eslint"

const eslintConfig = defineConfig([
	globalIgnores([
		"dist/**",
		".next/**",
		".output/**",
		".nitro/**",
		".tanstack/**",
		".vinxi/**",
		"src/routeTree.gen.ts",
	]),
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["scripts/**/*.mjs"],
		languageOptions: {
			globals: { process: "readonly", console: "readonly" },
		},
	},
])

export default eslintConfig
