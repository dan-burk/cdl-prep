import type { TranscriptLine } from '../firebase'
import { RATE } from './audio'

// Event names from xAI's realtime reference: https://docs.x.ai/voice-realtime.ws.json
const URL = 'wss://api.x.ai/v1/realtime?model=grok-voice-latest'

// Terms the transcriber would otherwise mishear
const KEYTERMS = ['CDL', 'GVWR', 'PSI', 'BAC', 'hazmat', 'air brakes', 'South Dakota', 'fifth wheel', 'glad hands', 'slack adjuster', 'tractor', 'trailer', 'kingpin', 'jackknife']

interface Handlers {
  onAudio: (b64: string) => void
  /** He started talking: stop the tutor's audio now */
  onBargeIn: () => void
  onLine: (line: TranscriptLine) => void
  onTool: (name: string, args: Record<string, unknown>) => unknown
  onClose: (unexpected: boolean) => void
}

type ServerEvent = { type: string; [k: string]: unknown }

export class VoiceTutor {
  private ws?: WebSocket
  private ready = false
  private closing = false
  private responding = false
  private wantResponse = false
  private tutorText = new Map<string, string>()

  constructor(private h: Handlers) {}

  /** Resolves once the session is configured; rejects if the socket fails first */
  connect(token: string, opts: { instructions: string; tools: object[]; voice?: string }) {
    return new Promise<void>((resolve, reject) => {
      // Browsers can't set headers on a WebSocket, so the ephemeral token rides in the subprotocol
      const ws = new WebSocket(URL, [`xai-client-secret.${token}`])
      this.ws = ws
      ws.onopen = () => this.send({
        type: 'session.update',
        session: {
          instructions: opts.instructions,
          voice: opts.voice ?? 'eve',
          turn_detection: { type: 'server_vad' },
          tools: opts.tools,
          audio: {
            input: { format: { type: 'audio/pcm', rate: RATE }, transcription: { model: 'grok-transcribe', language_hint: 'en', keyterms: KEYTERMS } },
            output: { format: { type: 'audio/pcm', rate: RATE } },
          },
        },
      })
      ws.onmessage = e => {
        let ev: ServerEvent
        try { ev = JSON.parse(e.data as string) } catch { return }
        if (ev.type === 'session.updated' && !this.ready) {
          this.ready = true
          resolve()
          // The tutor speaks first
          this.send({ type: 'response.create' })
        }
        this.handle(ev)
      }
      ws.onerror = () => { if (!this.ready) reject(new Error('connection failed')) }
      ws.onclose = () => {
        if (!this.ready) reject(new Error('connection closed'))
        else this.h.onClose(!this.closing)
      }
    })
  }

  appendAudio(b64: string) {
    if (this.ready) this.send({ type: 'input_audio_buffer.append', audio: b64 })
  }

  /** A behind-the-scenes note to the tutor, e.g. the one-minute warning */
  instruct(text: string) {
    this.send({ type: 'conversation.item.create', item: { type: 'message', role: 'system', content: [{ type: 'input_text', text }] } })
    // Mid-reply, the note is picked up on the next turn; otherwise ask for one now
    if (!this.responding) this.send({ type: 'response.create' })
  }

  /** One new reply at a time: asking during an active reply is an error, so wait for response.done */
  private respond() {
    if (this.responding) this.wantResponse = true
    else this.send({ type: 'response.create' })
  }

  close() {
    this.closing = true
    this.ws?.close()
  }

  private send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
  }

  private handle(ev: ServerEvent) {
    switch (ev.type) {
      case 'response.output_audio.delta':
      case 'response.audio.delta':
        this.h.onAudio(ev.delta as string)
        break
      case 'input_audio_buffer.speech_started':
        this.h.onBargeIn()
        break
      case 'response.created':
        this.responding = true
        break
      case 'response.done':
        this.responding = false
        // Tool results (all of them, if it called several) are in; let the tutor carry on
        if (this.wantResponse) {
          this.wantResponse = false
          this.send({ type: 'response.create' })
        }
        break
      case 'response.output_audio_transcript.delta': {
        const id = ev.item_id as string
        this.tutorText.set(id, (this.tutorText.get(id) ?? '') + (ev.delta as string))
        break
      }
      case 'response.output_audio_transcript.done': {
        const id = ev.item_id as string
        const text = this.tutorText.get(id)?.trim()
        this.tutorText.delete(id)
        if (text) this.h.onLine({ role: 'tutor', text })
        break
      }
      case 'conversation.item.input_audio_transcription.completed': {
        const text = (ev.transcript as string | undefined)?.trim()
        if (text) this.h.onLine({ role: 'user', text })
        break
      }
      case 'response.function_call_arguments.done':
        this.runTool(ev)
        break
      case 'error':
        // Most errors leave the session open, so log rather than end the talk
        console.error('xAI realtime error', ev.error)
        break
    }
  }

  private runTool(ev: ServerEvent) {
    let args: Record<string, unknown> = {}
    try { args = JSON.parse((ev.arguments as string) || '{}') } catch { /* empty args */ }
    let output: unknown
    try {
      output = this.h.onTool(ev.name as string, args)
    } catch (err) {
      output = { error: String(err) }
    }
    this.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: ev.call_id, output: JSON.stringify(output) } })
    this.respond()
  }
}
