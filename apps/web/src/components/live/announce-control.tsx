import { useForm } from "@tanstack/react-form"
import { Megaphone, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldContent, FieldError } from "@/components/ui/field"
import { announce } from "@/server/rooms"
import { announceFormSchema } from "@/schemas/broadcast"
import { isDemoMode } from "@/lib/demo"

export function AnnounceControl({
	targets,
	placeholder,
	onSent,
}: {
	targets: string[]
	placeholder?: string
	onSent?: (text: string, delivered: number) => void
}) {
	const demo = isDemoMode()

	const form = useForm({
		defaultValues: { text: "" },
		validators: { onChange: announceFormSchema },
		onSubmit: async ({ value }) => {
			const text = value.text.trim()
			if (!text || targets.length === 0) return
			const settled = await Promise.allSettled(
				targets.map((domiaKey) => announce({ data: { domiaKey, text } })),
			)
			let delivered = 0
			let failed = 0
			let firstError: string | undefined
			for (const s of settled) {
				if (s.status === "fulfilled" && s.value.ok && s.value.data?.delivered) {
					delivered++
				} else {
					failed++
					if (!firstError)
						firstError =
							s.status === "fulfilled" && !s.value.ok
								? s.value.error
								: undefined
				}
			}
			if (delivered > 0) {
				toast.success(
					failed > 0
						? `Announced to ${delivered} Domia(s) · ${failed} failed`
						: `Announced to ${delivered} Domia(s)`,
				)
				onSent?.(text, delivered)
				form.reset()
			} else {
				toast.error("No Domia played the announcement", {
					description: firstError,
				})
			}
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
			className="space-y-2"
		>
			<form.Field name="text">
				{(field) => (
					<Field data-invalid={field.state.meta.errors.length > 0}>
						<FieldContent>
							<Textarea
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								placeholder={placeholder ?? "Type an announcement…"}
								className="min-h-20"
								disabled={demo}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 ? (
								<FieldError errors={field.state.meta.errors} />
							) : null}
						</FieldContent>
					</Field>
				)}
			</form.Field>
			<form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
				{([isSubmitting, canSubmit]) => (
					<Button
						type="submit"
						size="sm"
						disabled={demo || isSubmitting || !canSubmit || !targets.length}
					>
						{isSubmitting ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Megaphone className="size-4" />
						)}
						Broadcast
					</Button>
				)}
			</form.Subscribe>
		</form>
	)
}
