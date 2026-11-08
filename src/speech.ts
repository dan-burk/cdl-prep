import { useEffect, useState } from 'react'

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

/** English voices, which load asynchronously in most browsers */
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    if (!canSpeak) return
    const update = () => setVoices(speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')))
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}

/** Google US English first (Chrome only), then the natural-sounding voices Edge and Safari ship */
function bestVoice(voices: SpeechSynthesisVoice[]) {
  const us = voices.filter(v => v.lang === 'en-US')
  return us.find(v => v.name === 'Google US English')
    ?? us.find(v => /natural/i.test(v.name))
    ?? us.find(v => /google|samantha|aria|jenny/i.test(v.name))
    ?? us[0] ?? voices[0]
}

export function speak(text: string, opts: { rate: number; voice: string; voices: SpeechSynthesisVoice[] }) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = opts.voices.find(v => v.name === opts.voice) ?? bestVoice(opts.voices)
  if (voice) {
    u.voice = voice
    u.lang = voice.lang
  }
  u.rate = opts.rate
  speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel()
}
