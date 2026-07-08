import { m } from "@/paraglide/messages"
import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export function TagEditor({
	values,
	onChange,
	placeholder,
}: {
	values: string[]
	onChange: (next: string[]) => void
	placeholder?: string
}) {
	const [draft, setDraft] = useState("")

	const add = (raw: string) => {
		const value = raw.trim()
		if (value && !values.includes(value)) onChange([...values, value])
		setDraft("")
	}

	return (
		<div className="space-y-2">
			{values.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{values.map((tag) => (
						<Badge key={tag} variant="secondary" className="gap-1">
							{tag}
							<button
								type="button"
								onClick={() => onChange(values.filter((t) => t !== tag))}
								aria-label={m.aria_remove_tag({ tag })}
							>
								<X className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			)}
			<Input
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault()
						add(draft)
					}
				}}
				placeholder={placeholder}
				className="h-8"
			/>
		</div>
	)
}
