/** xAI's default: mono 16-bit PCM at 24 kHz, both directions */
export const RATE = 24000

let shared: AudioContext | undefined

/**
 * Call from inside a tap handler. iPhone Safari only lets audio start from a user gesture,
 * so the context is made (or woken) there and reused once the talk connects.
 */
export function unlockAudio() {
  shared ??= new AudioContext()
  shared.resume().catch(() => {})
  return shared
}

// Runs on the audio thread. Resamples from the context rate (often 48 kHz) to 24 kHz with
// linear interpolation and posts 100 ms chunks of Int16 samples.
const WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.step = sampleRate / ${RATE}
    this.pos = 0
    this.prev = 0
    this.out = new Int16Array(${RATE / 10})
    this.n = 0
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (!ch || !ch.length) return true
    const len = ch.length
    // Virtual signal: [prev, ...ch], so interpolation can span the block boundary
    while (this.pos < len) {
      const i = Math.floor(this.pos)
      const a = i === 0 ? this.prev : ch[i - 1]
      const s = a + (ch[i] - a) * (this.pos - i)
      this.out[this.n++] = Math.max(-1, Math.min(1, s)) * 0x7fff
      if (this.n === this.out.length) {
        this.port.postMessage(this.out.buffer, [this.out.buffer])
        this.out = new Int16Array(${RATE / 10})
        this.n = 0
      }
      this.pos += this.step
    }
    this.pos -= len
    this.prev = ch[len - 1]
    return true
  }
}
registerProcessor('capture-24k', Capture)
`

const loaded = new WeakSet<AudioContext>()

function toBase64(bytes: Uint8Array) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function fromBase64(b64: string) {
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

/** Starts the mic and calls onChunk with base64 PCM16 at 24 kHz. Returns a stop function. */
export async function startMic(ctx: AudioContext, onChunk: (b64: string) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  })
  // A second talk reuses the context, and registering the processor twice would throw
  if (!loaded.has(ctx)) {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }))
    try {
      await ctx.audioWorklet.addModule(url)
      loaded.add(ctx)
    } catch (err) {
      stream.getTracks().forEach(t => t.stop())
      throw err
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const source = ctx.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(ctx, 'capture-24k')
  node.port.onmessage = e => onChunk(toBase64(new Uint8Array(e.data as ArrayBuffer)))
  source.connect(node)
  // Chrome only pulls audio through nodes that reach the destination; the worklet outputs silence
  node.connect(ctx.destination)
  return () => {
    node.port.onmessage = null
    source.disconnect()
    node.disconnect()
    stream.getTracks().forEach(t => t.stop())
  }
}

/** Plays streamed PCM16 chunks back to back; flush() cuts it off instantly when he starts talking */
export class Player {
  private next = 0
  private sources = new Set<AudioBufferSourceNode>()

  constructor(private ctx: AudioContext, private onPlaying: (playing: boolean) => void) {}

  push(b64: string) {
    const bytes = fromBase64(b64)
    const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1)
    if (!pcm.length) return
    // The context resamples a 24 kHz buffer to its own rate on playback
    const buf = this.ctx.createBuffer(1, pcm.length, RATE)
    const data = buf.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.connect(this.ctx.destination)
    const at = Math.max(this.ctx.currentTime + 0.02, this.next)
    src.start(at)
    this.next = at + buf.duration
    if (!this.sources.size) this.onPlaying(true)
    this.sources.add(src)
    src.onended = () => {
      this.sources.delete(src)
      if (!this.sources.size) this.onPlaying(false)
    }
  }

  flush() {
    for (const src of this.sources) {
      src.onended = null
      try { src.stop() } catch { /* already stopped */ }
    }
    const was = this.sources.size > 0
    this.sources.clear()
    this.next = 0
    if (was) this.onPlaying(false)
  }
}
