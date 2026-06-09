import { useRouter } from "@tanstack/react-router"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CatchBoundary() {
	const router = useRouter()

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
			<div className="bg-destructive/10 text-destructive mb-6 flex size-16 items-center justify-center rounded-2xl">
				<TriangleAlert className="size-8" />
			</div>
			<h1 className="text-2xl font-semibold tracking-tight">
				Something went wrong
			</h1>
			<p className="text-muted-foreground mt-2 max-w-md text-sm">
				An unexpected error occurred while loading this view.
			</p>
			<Button className="mt-6" onClick={() => router.invalidate()}>
				Try again
			</Button>
		</div>
	)
}
