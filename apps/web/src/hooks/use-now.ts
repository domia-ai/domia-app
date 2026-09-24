import { useEffect, useState } from "react"

const TICK_MS = 1000

export const useNow = (): number => {
	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), TICK_MS)
		return () => clearInterval(id)
	}, [])
	return now
}
