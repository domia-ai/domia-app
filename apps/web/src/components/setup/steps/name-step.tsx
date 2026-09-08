import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { summarizeApply } from "@/lib/config-apply"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { setSetupNameFn } from "@/server/setup"
import { DEFAULT_NODE_NAME } from "@/constants/setup"
import { isDemoMode } from "@/lib/demo"
import { StepShell, ContinueButton } from "./step-shell"
import type { SetupStepProps } from "@/types/setup-ui"

export function NameStep({
	domiaKey,
	domiaName,
	online,
	onNext,
}: SetupStepProps) {
	const queryClient = useQueryClient()
	const [name, setName] = useState(
		domiaName === DEFAULT_NODE_NAME ? "" : domiaName,
	)
	const trimmed = name.trim()
	const unchanged = trimmed === domiaName

	const mutation = useMutation({
		mutationFn: () => setSetupNameFn({ data: { domiaKey, name: trimmed } }),
	})

	const save = async () => {
		const result = await mutation.mutateAsync()
		if (result.ok && result.data) {
			toast.success(m.setup_name_saved({ name: trimmed }), {
				description: result.data.apply
					? summarizeApply(result.data.apply)
					: undefined,
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
				queryClient.invalidateQueries({ queryKey: ["setup-targets"] }),
				queryClient.invalidateQueries({ queryKey: ["setup-candidates"] }),
				queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
			])
			onNext()
		} else {
			toast.error(m.toast_config_save_failed(), {
				description: errText(result.ok ? undefined : result.error),
			})
		}
	}

	return (
		<StepShell
			title={m.setup_name_title()}
			description={m.setup_name_desc()}
			onSkip={onNext}
			primary={
				unchanged ? (
					<ContinueButton onClick={onNext} />
				) : (
					<Button
						type="button"
						disabled={!trimmed || !online || mutation.isPending || isDemoMode()}
						onClick={save}
					>
						{mutation.isPending && <Loader2 className="size-4 animate-spin" />}
						{m.setup_name_save()}
					</Button>
				)
			}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					if (trimmed && !unchanged) void save()
				}}
				className="max-w-sm"
			>
				<Field>
					<FieldLabel htmlFor="setup-name">{m.dlg_field_name()}</FieldLabel>
					<Input
						id="setup-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={m.dlg_identity_name_placeholder()}
						autoFocus
					/>
				</Field>
				<p className="text-muted-foreground mt-2 text-xs">
					{m.setup_name_hint()}
				</p>
			</form>
		</StepShell>
	)
}
