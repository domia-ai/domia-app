import { Skeleton } from "@/components/ui/skeleton"
import type { AsyncBoundaryProps } from "@/types/async"

export function AsyncBoundary<T>({
	state,
	skeleton,
	children,
}: AsyncBoundaryProps<T>) {
	if (state.status === "loading")
		return skeleton ?? <Skeleton className="h-24 w-full" />
	if (state.status === "error")
		return <p className="text-destructive text-sm">{state.message}</p>
	return children(state.data)
}
