import { useState } from "react"
import { Check, Copy } from "lucide-react"
import type { CopyButtonProps } from "@/types/conversations"

export function CopyButton({ text, label }: CopyButtonProps) {
	const [copied, setCopied] = useState(false)

	const onCopy = (e: React.MouseEvent) => {
		e.stopPropagation()
		void navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
	}

	return (
		<button
			type="button"
			onClick={onCopy}
			className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
		>
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
			{label}
		</button>
	)
}
