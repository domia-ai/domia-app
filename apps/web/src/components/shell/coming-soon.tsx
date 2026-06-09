export function ComingSoon({ label = "Coming soon" }: { label?: string }) {
	return (
		<div className="text-muted-foreground flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed text-sm">
			{label}
		</div>
	)
}
