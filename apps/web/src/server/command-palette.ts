import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getCommandPalette } from "@/services/command-palette"

export const getCommandPaletteFn = createServerFn({ method: "GET" }).handler(
	() => getCommandPalette(),
)

export const commandPaletteQueryOptions = () =>
	queryOptions({
		queryKey: ["command-palette"],
		queryFn: () => getCommandPaletteFn(),
	})
