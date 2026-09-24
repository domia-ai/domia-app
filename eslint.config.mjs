// @ts-check
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierConfig from "eslint-config-prettier"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import globals from "globals"
import { globalIgnores } from "eslint/config"

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.stylistic,
	prettierConfig,
	prettierPlugin,
	{
		rules: {
			"@typescript-eslint/consistent-type-definitions": ["warn", "type"],
		},
	},
	{
		files: ["**/scripts/**"],
		languageOptions: { globals: globals.node },
	},
	{
		files: ["apps/web/src/router.tsx"],
		rules: { "@typescript-eslint/consistent-type-definitions": "off" },
	},
	globalIgnores([
		"**/build/**",
		"**/dist/**",
		"**/.next/**",
		"**/node_modules/**",
		"**/src/paraglide/**",
		"**/routeTree.gen.ts",
		"**/.output/**",
		"**/.nitro/**",
		"**/.tanstack/**",
		"**/.vinxi/**",
	]),
)
