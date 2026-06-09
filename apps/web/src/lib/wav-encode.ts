const TARGET_RATE = 16000

const floatToWavBase64 = (
	samples: Float32Array,
	sampleRate: number,
): string => {
	const buffer = new ArrayBuffer(44 + samples.length * 2)
	const view = new DataView(buffer)
	const writeStr = (offset: number, s: string) => {
		for (let i = 0; i < s.length; i++)
			view.setUint8(offset + i, s.charCodeAt(i))
	}
	writeStr(0, "RIFF")
	view.setUint32(4, 36 + samples.length * 2, true)
	writeStr(8, "WAVE")
	writeStr(12, "fmt ")
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, 1, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * 2, true)
	view.setUint16(32, 2, true)
	view.setUint16(34, 16, true)
	writeStr(36, "data")
	view.setUint32(40, samples.length * 2, true)

	let offset = 44
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]))
		view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
		offset += 2
	}

	const bytes = new Uint8Array(buffer)
	let binary = ""
	const chunk = 0x8000
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
	}
	return btoa(binary)
}

export const blobToWav16kBase64 = async (blob: Blob): Promise<string> => {
	const arrayBuffer = await blob.arrayBuffer()
	const decodeCtx = new AudioContext()
	const decoded = await decodeCtx.decodeAudioData(arrayBuffer)
	await decodeCtx.close()

	const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE))
	const offline = new OfflineAudioContext(1, length, TARGET_RATE)
	const source = offline.createBufferSource()
	source.buffer = decoded
	source.connect(offline.destination)
	source.start()
	const rendered = await offline.startRendering()

	return floatToWavBase64(rendered.getChannelData(0), TARGET_RATE)
}
