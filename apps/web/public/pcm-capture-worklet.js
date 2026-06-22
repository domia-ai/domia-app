class PcmCaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
		this.chunks = []
		this.count = 0
		this.target = 2048
	}

	process(inputs) {
		const channel = inputs[0] && inputs[0][0]
		if (channel) {
			const pcm = new Int16Array(channel.length)
			for (let i = 0; i < channel.length; i++) {
				const s = Math.max(-1, Math.min(1, channel[i]))
				pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
			}
			this.chunks.push(pcm)
			this.count += pcm.length
			if (this.count >= this.target) {
				const out = new Int16Array(this.count)
				let offset = 0
				for (const chunk of this.chunks) {
					out.set(chunk, offset)
					offset += chunk.length
				}
				this.port.postMessage(out.buffer, [out.buffer])
				this.chunks = []
				this.count = 0
			}
		}
		return true
	}
}

registerProcessor("pcm-capture", PcmCaptureProcessor)
