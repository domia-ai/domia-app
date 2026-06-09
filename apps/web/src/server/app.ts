import { createServerFn } from "@tanstack/react-start"
import { getShellData } from "@/services/shell"

export const getShellDataFn = createServerFn({ method: "GET" }).handler(() =>
	getShellData(),
)
