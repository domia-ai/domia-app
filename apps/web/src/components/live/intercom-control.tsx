import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Radio, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldError } from "@/components/ui/field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { intercom } from "@/server/rooms"
import { intercomFormSchema } from "@/schemas/broadcast"
import { isDemoMode } from "@/lib/demo"
import type { LiveRoom } from "@/types/live"

export function IntercomControl({
	hostDomiaKey,
	rooms,
}: {
	hostDomiaKey: string
	rooms: LiveRoom[]
}) {
	const demo = isDemoMode()
	const [intercomOn, setIntercomOn] = useState(false)
	const [stopping, setStopping] = useState(false)
	const nameOf = (key: string) =>
		rooms.find((r) => r.domiaKey === key)?.name ?? key

	const form = useForm({
		defaultValues: { from: "", to: "" },
		validators: { onChange: intercomFormSchema },
		onSubmit: async ({ value }) => {
			const result = await intercom({
				data: { hostDomiaKey, from: value.from, to: value.to },
			})
			if (result.ok) {
				setIntercomOn(true)
				toast.success("Intercom live")
			} else {
				toast.error("Could not start intercom", { description: result.error })
			}
		},
	})

	const onStop = async () => {
		setStopping(true)
		const result = await intercom({
			data: { hostDomiaKey, from: form.state.values.from, to: null },
		})
		setStopping(false)
		if (result.ok) {
			setIntercomOn(false)
			toast.success("Intercom stopped")
		} else {
			toast.error("Could not stop intercom", { description: result.error })
		}
	}

	const roomSelect = (field: {
		state: { value: string }
		handleChange: (value: string) => void
		handleBlur: () => void
	}) => (
		<Select
			value={field.state.value}
			onValueChange={(v) => v && field.handleChange(v)}
			disabled={demo || intercomOn}
		>
			<SelectTrigger className="h-8 flex-1" onBlur={field.handleBlur}>
				<SelectValue placeholder="Room">
					{(value) => (value ? nameOf(String(value)) : "Room")}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{rooms.map((r) => (
					<SelectItem key={r.domiaKey} value={r.domiaKey}>
						{r.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
			className="space-y-2"
		>
			<Field>
				<FieldContent>
					<div className="flex items-center gap-2">
						<form.Field name="from">{(field) => roomSelect(field)}</form.Field>
						<span className="text-muted-foreground text-xs">→</span>
						<form.Field name="to">{(field) => roomSelect(field)}</form.Field>
					</div>
					<form.Subscribe selector={(s) => s.fieldMeta}>
						{(fieldMeta) => {
							const errors = [
								...(fieldMeta.from?.errors ?? []),
								...(fieldMeta.to?.errors ?? []),
							]
							const touched = Boolean(
								fieldMeta.from?.isTouched || fieldMeta.to?.isTouched,
							)
							return touched && errors.length > 0 ? (
								<FieldError errors={errors} />
							) : null
						}}
					</form.Subscribe>
				</FieldContent>
			</Field>

			{intercomOn ? (
				<Button
					type="button"
					size="sm"
					variant="destructive"
					disabled={demo || stopping}
					onClick={onStop}
				>
					{stopping ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Radio className="size-4" />
					)}
					Stop intercom
				</Button>
			) : (
				<form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
					{([isSubmitting, canSubmit]) => (
						<Button
							type="submit"
							size="sm"
							variant="outline"
							disabled={demo || isSubmitting || !canSubmit}
						>
							{isSubmitting ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Radio className="size-4" />
							)}
							Start intercom
						</Button>
					)}
				</form.Subscribe>
			)}
		</form>
	)
}
