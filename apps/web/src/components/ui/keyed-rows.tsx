import { useState } from "react"
import type { KeyedRow, KeyedRowsCodec, KeyedRowsState } from "@/types/config"

const rowsKey = (value: Record<string, unknown>): string =>
	JSON.stringify(value)

const entriesCodec = <T,>(): KeyedRowsCodec<T, T> => ({
	toRows: (value) => Object.entries(value),
	fromRows: (rows) => Object.fromEntries(rows),
})

export const useCodecRows = <T, R>(
	value: Record<string, T> | undefined,
	onChange: (v: Record<string, T>) => void,
	codec: KeyedRowsCodec<T, R>,
) => {
	const current = value ?? {}
	const key = rowsKey(current)
	const [state, setState] = useState<KeyedRowsState<R>>({
		key,
		rows: codec.toRows(current),
	})
	if (state.key !== key) setState({ key, rows: codec.toRows(current) })

	const setRows = (rows: KeyedRow<R>[]) => {
		const next = codec.fromRows(rows)
		setState({ key: rowsKey(next), rows })
		onChange(next)
	}
	return { rows: state.rows, setRows }
}

export const useKeyedRows = <T,>(
	value: Record<string, T> | undefined,
	onChange: (v: Record<string, T>) => void,
) => useCodecRows(value, onChange, entriesCodec<T>())
