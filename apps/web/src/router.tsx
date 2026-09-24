import { MutationCache, QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
	const queryClient = new QueryClient({
		mutationCache: new MutationCache({
			onError: (_error, _variables, _context, mutation) => {
				if (mutation.options.onError) return
				toast.error(m.err_request_failed())
			},
		}),
		defaultOptions: {
			queries: {
				staleTime: 1000 * 30,
				gcTime: 1000 * 60 * 10,
				refetchOnWindowFocus: false,
				retry: 1,
			},
		},
	})

	const router = createRouter({
		routeTree,
		context: { queryClient },
		defaultPreload: "intent",
		scrollRestoration: true,
	})

	setupRouterSsrQueryIntegration({ router, queryClient })

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
