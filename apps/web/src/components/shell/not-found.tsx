import { Link } from "@tanstack/react-router"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"

export function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
			<img
				src="/not-found.webp"
				alt="Domia"
				width={180}
				height={180}
				className="mb-6 size-40 object-contain"
			/>
			<p className="text-muted-foreground text-sm font-medium">404</p>
			<h1 className="mt-1 text-2xl font-semibold tracking-tight">
				{m.shell_not_found_title()}
			</h1>
			<p className="text-muted-foreground mt-2 max-w-md text-sm">
				{m.shell_not_found_desc()}
			</p>
			<Button className="mt-6" nativeButton={false} render={<Link to="/" />}>
				{m.shell_back_overview()}
			</Button>
		</div>
	)
}
