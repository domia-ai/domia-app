import type { RetryOptions } from "@/types"

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const isRetryable = (err: unknown): boolean => {
	if (err instanceof Error) {
		if (err.name === "AbortError" || err.name === "TimeoutError") return true
		if (/^(?:sync|audio) 5\d\d\b/.test(err.message)) return true
		if (/network|fetch failed|ECONN|ETIMEDOUT|socket/i.test(err.message))
			return true
	}
	return false
}

export const withRetry = async <T>(
	fn: () => Promise<T>,
	opts: RetryOptions = {},
): Promise<T> => {
	const attempts = opts.attempts ?? 3
	const baseDelayMs = opts.baseDelayMs ?? 300
	let lastError: unknown
	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			return await fn()
		} catch (err) {
			lastError = err
			if (attempt === attempts - 1 || !isRetryable(err)) break
			await sleep(baseDelayMs * 2 ** attempt)
		}
	}
	throw lastError
}
