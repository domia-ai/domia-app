import { useActionQuery } from "@/hooks/use-query-state"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { KeyValueListField } from "@/components/domia/config/descriptor-fields"
import { skillsStatusQueryOptions } from "@/server/skills"
import { SKILL_POLICY_BADGE_META } from "@/constants/skills"
import { ROUTINE_MAX_STEPS } from "@/constants/routines"
import { cn } from "@/lib/utils"
import type {
	RoutineArgRow,
	RoutineDraftStep,
	RoutineStepsProps,
	RoutineToolGroup,
} from "@/types/routines"

const usesSlot = (args: RoutineArgRow[], slotArg: string): boolean =>
	JSON.stringify(args).includes(`{${slotArg}}`)

export function RoutineSteps({
	domiaKey,
	steps,
	slotArgs,
	onChange,
}: RoutineStepsProps) {
	const { state } = useActionQuery(skillsStatusQueryOptions(domiaKey))
	const toolsError = state.status === "error" ? state.message : null

	const providers =
		state.status === "ready" ? (state.data?.providers ?? []) : []
	const groups: RoutineToolGroup[] = providers.map((provider) => ({
		providerId: provider.id,
		providerName: provider.name,
		tools: provider.tools.map((tool) => ({
			rawName: tool.namespacedName,
			displayName: tool.displayName,
			policy: tool.policy,
		})),
	}))
	const known = new Set(
		groups.flatMap((group) => group.tools.map((tool) => tool.rawName)),
	)
	const hasPicker = state.status === "ready" && known.size > 0

	const patch = (i: number, step: RoutineDraftStep) =>
		onChange(steps.map((s, idx) => (idx === i ? step : s)))

	return (
		<section className="space-y-3">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<h3 className="text-sm font-semibold">{m.routine_steps_title()}</h3>
					<p className="text-muted-foreground text-xs">
						{m.routine_steps_desc({ max: ROUTINE_MAX_STEPS })}
					</p>
				</div>
				{state.status === "loading" ? (
					<span className="text-muted-foreground flex items-center gap-1.5 text-xs">
						<Loader2 className="size-3.5 animate-spin" />
						{m.routine_steps_tools_loading()}
					</span>
				) : null}
			</div>

			{toolsError ? (
				<p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
					{m.routine_steps_tools_error({ error: toolsError })}
				</p>
			) : null}

			<div className="space-y-3">
				{steps.map((step, i) => {
					const policy = groups
						.flatMap((group) => group.tools)
						.find((tool) => tool.rawName === step.tool)?.policy
					const badge =
						policy === "confirm" || policy === "block"
							? SKILL_POLICY_BADGE_META[policy]
							: null
					return (
						<div
							key={i}
							className="border-border space-y-3 rounded-lg border p-3"
						>
							<div className="flex items-center gap-2">
								<Badge variant="secondary" className="font-mono text-[11px]">
									{i + 1}
								</Badge>
								{hasPicker ? (
									<Select
										value={step.tool}
										onValueChange={(tool) =>
											patch(i, { ...step, tool: tool ?? "" })
										}
									>
										<SelectTrigger
											className="flex-1"
											aria-label={m.routine_step_tool()}
										>
											<SelectValue placeholder={m.routine_step_tool()} />
										</SelectTrigger>
										<SelectContent>
											{step.tool && !known.has(step.tool) ? (
												<SelectItem value={step.tool}>
													{m.routine_step_tool_unknown({ tool: step.tool })}
												</SelectItem>
											) : null}
											{groups.map((group) => (
												<SelectGroup key={group.providerId}>
													<SelectLabel>{group.providerName}</SelectLabel>
													{group.tools.map((tool) => (
														<SelectItem
															key={tool.rawName}
															value={tool.rawName}
															disabled={tool.policy === "block"}
														>
															<span
																className={cn(
																	"font-mono text-xs",
																	tool.policy === "block" && "line-through",
																)}
															>
																{tool.displayName}
															</span>
														</SelectItem>
													))}
												</SelectGroup>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										className="flex-1 font-mono text-xs"
										value={step.tool}
										aria-label={m.routine_step_tool()}
										placeholder={m.routine_step_tool_placeholder()}
										onChange={(e) =>
											patch(i, { ...step, tool: e.target.value })
										}
									/>
								)}
								{badge ? (
									<Badge variant="outline" className={badge.className}>
										<badge.icon className="size-3" />
										{badge.label()}
									</Badge>
								) : null}
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-muted-foreground hover:text-destructive h-9 px-2"
									onClick={() => onChange(steps.filter((_, idx) => idx !== i))}
								>
									<Trash2 className="size-3.5" />
								</Button>
							</div>

							<KeyValueListField
								label={m.routine_step_args()}
								addLabel={m.routine_step_args_add()}
								rows={step.args}
								onChange={(args) => patch(i, { ...step, args })}
								keyLabel={m.routine_step_arg_key()}
								valuesLabel={m.routine_step_arg_value()}
							/>

							{slotArgs.length > 0 ? (
								<div className="space-y-1.5">
									<Label className="text-xs">{m.routine_step_slots()}</Label>
									<div className="flex flex-wrap gap-1.5">
										{slotArgs.map((slotArg) => (
											<Badge
												key={slotArg}
												variant={
													usesSlot(step.args, slotArg) ? "default" : "outline"
												}
												className="font-mono text-[11px]"
											>
												{`{${slotArg}}`}
											</Badge>
										))}
									</div>
									<p className="text-muted-foreground text-[11px]">
										{m.routine_step_slots_hint()}
									</p>
								</div>
							) : null}
						</div>
					)
				})}
			</div>

			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={steps.length >= ROUTINE_MAX_STEPS}
				onClick={() => onChange([...steps, { tool: "", args: [] }])}
			>
				<Plus className="size-3.5" />
				{m.routine_steps_add()}
			</Button>
		</section>
	)
}
