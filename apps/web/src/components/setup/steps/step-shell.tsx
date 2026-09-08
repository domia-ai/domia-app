import type { ReactNode } from "react"
import { ArrowRight, SkipForward } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StepShell({
	title,
	description,
	children,
	primary,
	onSkip,
}: {
	title: string
	description: string
	children: ReactNode
	primary: ReactNode
	onSkip?: () => void
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
				<p className="text-muted-foreground text-sm">{description}</p>
			</CardHeader>
			<CardContent className="space-y-5">
				{children}
				<div className="flex flex-wrap items-center gap-2 border-t pt-4">
					{onSkip && (
						<Button type="button" variant="ghost" onClick={onSkip}>
							<SkipForward className="size-4" />
							{m.setup_skip()}
						</Button>
					)}
					<div className="ml-auto flex items-center gap-2">{primary}</div>
				</div>
			</CardContent>
		</Card>
	)
}

export function ContinueButton({
	onClick,
	label = m.setup_continue(),
	disabled,
}: {
	onClick: () => void
	label?: string
	disabled?: boolean
}) {
	return (
		<Button type="button" onClick={onClick} disabled={disabled}>
			{label}
			<ArrowRight className="size-4" />
		</Button>
	)
}
