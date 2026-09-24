import { m } from "@/paraglide/messages"
import { locales } from "@/paraglide/runtime"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListInput } from "@/components/ui/list-input"
import {
	ROUTINE_MAX_PHRASES_PER_LOCALE,
	ROUTINE_MAX_REPLY_CHARS,
} from "@/constants/routines"
import type { RoutinePhrasesProps } from "@/types/routines"

export function RoutinePhrases({
	phrases,
	reply,
	onPhrases,
	onReply,
}: RoutinePhrasesProps) {
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">{m.routine_phrases_title()}</h3>
				<p className="text-muted-foreground text-xs">
					{m.routine_phrases_desc()}
				</p>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				{locales.map((locale) => {
					const lines = phrases[locale] ?? []
					return (
						<div
							key={locale}
							className="border-border space-y-2.5 rounded-lg border p-3"
						>
							<div className="flex items-center justify-between">
								<Label className="text-xs font-semibold tracking-wide uppercase">
									{locale}
								</Label>
								<span className="text-muted-foreground text-[11px]">
									{m.routine_phrases_count({
										count: lines.length,
										max: ROUTINE_MAX_PHRASES_PER_LOCALE,
									})}
								</span>
							</div>
							<div className="space-y-1.5">
								<Label
									className="text-xs"
									htmlFor={`routine-phrases-${locale}`}
								>
									{m.routine_phrases_field()}
								</Label>
								<ListInput
									multiline
									id={`routine-phrases-${locale}`}
									rows={4}
									maxItems={ROUTINE_MAX_PHRASES_PER_LOCALE}
									value={lines}
									placeholder={m.routine_phrases_placeholder()}
									onChange={(next) => onPhrases({ ...phrases, [locale]: next })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs" htmlFor={`routine-reply-${locale}`}>
									{m.routine_reply_field()}
								</Label>
								<Input
									id={`routine-reply-${locale}`}
									maxLength={ROUTINE_MAX_REPLY_CHARS}
									value={reply[locale] ?? ""}
									placeholder={m.routine_reply_placeholder()}
									onChange={(e) =>
										onReply({ ...reply, [locale]: e.target.value })
									}
								/>
							</div>
						</div>
					)
				})}
			</div>
		</section>
	)
}
