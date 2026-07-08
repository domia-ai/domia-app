/// <reference types="vite/client" />
import type { ReactNode } from "react"
import { getLocale } from "@/paraglide/runtime"
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/providers/theme"
import { ConsolePrefsProvider } from "@/components/providers/console-prefs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { NotFound } from "@/components/shell/not-found"
import { CatchBoundary } from "@/components/shell/catch-boundary"
import appCss from "@/styles/globals.css?url"

const description =
	"The local Console for a fleet of Domia voice-AI devices — see every Domia, its conversations, moods and memory, and manage the fleet on-prem."

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		head: () => ({
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ title: "Domia Console" },
				{ name: "description", content: description },
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/domia.webp", type: "image/webp" },
			],
		}),
		component: RootComponent,
		errorComponent: () => (
			<RootDocument>
				<CatchBoundary />
			</RootDocument>
		),
		notFoundComponent: () => (
			<RootDocument>
				<NotFound />
			</RootDocument>
		),
	},
)

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	)
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang={getLocale()} className="h-full" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-full flex-col font-sans antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					<ConsolePrefsProvider>
						<TooltipProvider>{children}</TooltipProvider>
						<Toaster />
					</ConsolePrefsProvider>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	)
}
