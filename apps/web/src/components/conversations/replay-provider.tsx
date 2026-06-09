import {
	createContext,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react"
import type { WaveformHandle } from "@/types"
import type {
	ReplayController,
	ReplaySink,
	ReplayState,
	ReplayTrackKind,
} from "@/types/conversations"

const DEFAULT_STATE: ReplayState = {
	phase: "idle",
	activeStepKey: null,
	running: false,
}

const NOOP_CONTROLLER: ReplayController = {
	registerTrack: () => {},
	getTrack: () => null,
	emitReady: () => {},
	emitFinish: () => {},
	emitProgress: () => {},
	setSink: () => {},
}

const ReplayStateContext = createContext<ReplayState>(DEFAULT_STATE)
const ReplaySetContext = createContext<(state: ReplayState) => void>(() => {})
const ReplayControllerContext = createContext<ReplayController>(NOOP_CONTROLLER)

export function ReplayProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<ReplayState>(DEFAULT_STATE)
	const tracks = useRef<Record<ReplayTrackKind, WaveformHandle | null>>({
		input: null,
		tts: null,
	})
	const sink = useRef<ReplaySink>({})

	const controller = useMemo<ReplayController>(
		() => ({
			registerTrack: (kind, handle) => {
				tracks.current[kind] = handle
			},
			getTrack: (kind) => tracks.current[kind],
			emitReady: (kind, duration) => sink.current.onReady?.(kind, duration),
			emitFinish: (kind) => sink.current.onFinish?.(kind),
			emitProgress: (kind, time) => sink.current.onProgress?.(kind, time),
			setSink: (s) => {
				sink.current = s
			},
		}),
		[],
	)

	return (
		<ReplayControllerContext.Provider value={controller}>
			<ReplaySetContext.Provider value={setState}>
				<ReplayStateContext.Provider value={state}>
					{children}
				</ReplayStateContext.Provider>
			</ReplaySetContext.Provider>
		</ReplayControllerContext.Provider>
	)
}

export const useReplayState = () => useContext(ReplayStateContext)
export const useReplaySet = () => useContext(ReplaySetContext)
export const useReplayController = () => useContext(ReplayControllerContext)
