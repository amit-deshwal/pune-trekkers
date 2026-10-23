import { useState } from 'react'
import { copyText } from '../lib/clipboard'

// Phones open the system share sheet (WhatsApp, Instagram…); elsewhere the message is copied, ready to paste.
export default function ShareButton({ title, text, label = 'Share with friends' }: { title: string; text: string; label?: string }) {
  const [state, setState] = useState<'' | 'copied' | 'failed'>('')
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, text }); return } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return }
    }
    setState(await copyText(text) ? 'copied' : 'failed'); setTimeout(() => setState(''), 2500)
  }
  return <button type="button" className="button button-outline" onClick={share}>
    {state === 'copied' ? 'Copied ✓ Paste it in a chat' : state === 'failed' ? 'Could not copy' : label}
  </button>
}
