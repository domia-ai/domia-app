import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ListInputProps } from "@/types/config"

const joinList = (value: string[], multiline: boolean): string =>
	value.join(multiline ? "\n" : ", ")

const parseList = (
	raw: string,
	multiline: boolean,
	maxItems?: number,
): string[] => {
	const items = raw
		.split(multiline ? "\n" : ",")
		.map((s) => s.trim())
		.filter(Boolean)
	return maxItems === undefined ? items : items.slice(0, maxItems)
}

const listKey = (value: string[]): string => value.join("\n")

export function ListInput({
	value,
	onChange,
	multiline = false,
	maxItems,
	rows = 3,
	...rest
}: ListInputProps) {
	const key = listKey(value)
	const [state, setState] = useState({ key, raw: joinList(value, multiline) })
	if (state.key !== key) setState({ key, raw: joinList(value, multiline) })

	const commit = () => {
		const parsed = parseList(state.raw, multiline, maxItems)
		setState({ key: listKey(parsed), raw: joinList(parsed, multiline) })
		onChange(parsed)
	}
	const edit = (raw: string) => setState({ key: state.key, raw })

	if (multiline)
		return (
			<Textarea
				{...rest}
				rows={rows}
				spellCheck={false}
				value={state.raw}
				onChange={(e) => edit(e.target.value)}
				onBlur={commit}
			/>
		)
	return (
		<Input
			{...rest}
			value={state.raw}
			onChange={(e) => edit(e.target.value)}
			onBlur={commit}
			onKeyDown={(e) => {
				if (e.key !== "Enter") return
				e.preventDefault()
				commit()
			}}
		/>
	)
}
