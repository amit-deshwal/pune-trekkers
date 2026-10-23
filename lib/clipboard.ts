// Clipboard API needs a secure context; the hidden-textarea fallback covers older phone browsers.
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'
    document.body.appendChild(area); area.select(); const ok = document.execCommand('copy'); area.remove(); return ok
  }
}
