import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type { ActionMutationOptions } from "@/types/async"

export const useActionMutation = <TData, TVars>({
	mutationFn,
	failureTitle,
	onDone,
	onFail,
}: ActionMutationOptions<TData, TVars>) =>
	useMutation<ActionResult<TData>, Error, TVars>({
		mutationFn,
		onSuccess: (res, vars) => {
			if (res.ok) {
				onDone?.(res.data, vars)
				return
			}
			toast.error(failureTitle(), { description: errText(res.error) })
			onFail?.(vars)
		},
		onError: (_error, vars) => {
			toast.error(m.err_request_failed())
			onFail?.(vars)
		},
	})
