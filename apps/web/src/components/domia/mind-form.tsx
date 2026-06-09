import { useForm } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { TabsContent } from "@/components/ui/tabs"
import { TagEditor } from "./tag-editor"
import { mindSchema } from "@/schemas/mind"
import {
	CHARACTER_ENUM_FIELDS,
	CHARACTER_TAG_FIELDS,
	EMOTION_FIELDS,
	MIND_MODULE_FIELDS,
} from "@/constants/mind"
import type { MindSnapshot } from "@/types"

export function useMindForm(
	defaultValues: MindSnapshot,
	onSubmit: (value: MindSnapshot) => Promise<void> | void,
) {
	return useForm({
		defaultValues,
		validators: { onChange: mindSchema },
		onSubmit: async ({ value }) => {
			await onSubmit(value as MindSnapshot)
		},
	})
}

export type MindForm = ReturnType<typeof useMindForm>

export function MindFormFields({ form }: { form: MindForm }) {
	return (
		<>
			<TabsContent value="persona" className="mt-0">
				<FieldGroup>
					<form.Field name="character.name">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Name</FieldLabel>
								<FieldContent>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</FieldContent>
							</Field>
						)}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-2">
						{CHARACTER_ENUM_FIELDS.map((enumField) => (
							<form.Field
								key={enumField.key}
								name={`character.${enumField.key}`}
							>
								{(field) => {
									const options = enumField.values.includes(field.state.value)
										? enumField.values
										: [field.state.value, ...enumField.values]
									return (
										<Field>
											<FieldLabel>{enumField.label}</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(v) => v && field.handleChange(v)}
											>
												<SelectTrigger className="h-9">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{options.map((opt) => (
														<SelectItem key={opt} value={opt}>
															{opt}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									)
								}}
							</form.Field>
						))}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="character.language">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Language</FieldLabel>
									<FieldContent>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>
						<form.Field name="character.culturalBackground">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>
										Cultural background
									</FieldLabel>
									<FieldContent>
										<Input
											id={field.name}
											value={field.state.value ?? ""}
											onChange={(e) =>
												field.handleChange(e.target.value || null)
											}
											onBlur={field.handleBlur}
										/>
									</FieldContent>
								</Field>
							)}
						</form.Field>
					</div>

					{CHARACTER_TAG_FIELDS.map((tagField) => (
						<form.Field key={tagField.key} name={`character.${tagField.key}`}>
							{(field) => (
								<Field>
									<FieldLabel>{tagField.label}</FieldLabel>
									<TagEditor
										values={field.state.value ?? []}
										onChange={(next) =>
											field.handleChange(next.length ? next : null)
										}
										placeholder={`Add ${tagField.label.toLowerCase()}…`}
									/>
								</Field>
							)}
						</form.Field>
					))}
				</FieldGroup>
			</TabsContent>

			<TabsContent value="emotion" className="mt-0">
				<p className="text-muted-foreground mb-4 text-sm">
					Baseline mood the Domia starts from. Each axis ranges −1 to 1.
				</p>
				<FieldGroup>
					{EMOTION_FIELDS.map((axis) => (
						<form.Field key={axis.key} name={`emotionBaseline.${axis.key}`}>
							{(field) => (
								<Field>
									<div className="flex items-center justify-between">
										<FieldLabel>{axis.label}</FieldLabel>
										<span className="text-muted-foreground font-mono text-xs tabular-nums">
											{field.state.value.toFixed(2)}
										</span>
									</div>
									<Slider
										min={-1}
										max={1}
										step={0.05}
										value={[field.state.value]}
										onValueChange={(v) =>
											field.handleChange(Array.isArray(v) ? v[0] : v)
										}
									/>
								</Field>
							)}
						</form.Field>
					))}
				</FieldGroup>
			</TabsContent>

			<TabsContent value="modules" className="mt-0">
				<div className="space-y-1">
					{MIND_MODULE_FIELDS.map((mod) => (
						<form.Field key={mod.key} name={`modules.${mod.key}`}>
							{(field) => (
								<div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
									<div className="space-y-0.5">
										<p className="text-sm font-medium">{mod.label}</p>
										<p className="text-muted-foreground text-xs">{mod.hint}</p>
									</div>
									<Switch
										checked={field.state.value}
										onCheckedChange={(checked) => field.handleChange(checked)}
									/>
								</div>
							)}
						</form.Field>
					))}
				</div>
			</TabsContent>
		</>
	)
}
