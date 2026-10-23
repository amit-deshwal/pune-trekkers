import type { WeekendHike, weekendOf } from './weekend-share'
import { formatTime } from './site'

// A 1080×1920 Instagram story listing the weekend's hikes, drawn in the browser. Instagram's own buttons cover
// roughly the top and bottom 250px, so content stays between them and the bottom is left clear for a link sticker.
const W = 1080, H = 1920, PAD = 84
const colors = { bg: '#0f3f35', card: 'rgba(255,255,255,.08)', line: 'rgba(255,255,255,.16)', white: '#ffffff', soft: '#cfe0d9', sun: '#f6e6b8', teal: '#7fd6c4', ink: '#141916' }
const font = (weight: number, size: number) => `${weight} ${size}px Manrope, 'Avenir Next', system-ui, sans-serif`
const day = (date: string, options: Intl.DateTimeFormatOptions) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const lines: string[] = []; let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width || !line) line = next; else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) { lines.length = maxLines; let last = lines[maxLines - 1]; while (ctx.measureText(last + '…').width > width) last = last.slice(0, -1); lines[maxLines - 1] = last.trimEnd() + '…' }
  return lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src })

export async function drawStory(hikes: WeekendHike[], weekend: ReturnType<typeof weekendOf>, siteHost: string): Promise<Blob> {
  await Promise.all([document.fonts.load(font(800, 40)), document.fonts.load(font(600, 40))])
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H)
  // A soft mountain line behind everything, so the card isn't a flat block of green.
  ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 1460); ctx.lineTo(260, 1250); ctx.lineTo(420, 1380); ctx.lineTo(700, 1120); ctx.lineTo(1080, 1420); ctx.lineTo(W, H); ctx.fill()

  let y = 250
  try { const logo = await loadImage('/images/brand/pune-trekkers-logo-horizontal-white.png'); const lw = 460; ctx.drawImage(logo, PAD, y, lw, lw * logo.height / logo.width); y += lw * logo.height / logo.width + 70 } catch { y += 40 }
  ctx.fillStyle = colors.sun; ctx.font = font(800, 34); ctx.fillText('HIKES THIS WEEKEND', PAD, y); y += 86
  ctx.fillStyle = colors.white; ctx.font = font(800, 76)
  ctx.fillText(`${day(weekend.saturday, { weekday: 'short', day: 'numeric' })} – ${day(weekend.sunday, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')}`, PAD, y); y += 70

  // Each card is as tall as its text; titles shrink and lose their second line if five hikes would not fit above the sticker zone.
  const bottom = 1400, gap = 24, innerW = W - PAD * 2 - 80
  const layout = (count: number, titleSize: number, maxLines: number) => {
    ctx.font = font(800, titleSize); const extra = hikes.length - count
    const cards = hikes.slice(0, count).map(hike => { const lines = wrap(ctx, hike.title, innerW, maxLines); return { hike, lines, height: 58 + lines.length * (titleSize + 10) + 48 + 44 } })
    return { titleSize, cards, extra, total: cards.reduce((sum, card) => sum + card.height + gap, 0) + (extra ? 70 : 0) }
  }
  const options = [5, 4, 3, 2, 1].filter(count => count <= Math.max(1, hikes.length)).flatMap(count => [layout(count, 50, 2), layout(count, 44, 2), layout(count, 40, 1)])
  const { titleSize, cards, extra } = options.find(option => y + option.total <= bottom) ?? layout(1, 40, 1)
  for (const { hike, lines, height } of cards) {
    roundRect(ctx, PAD, y, W - PAD * 2, height, 32); ctx.fillStyle = colors.card; ctx.fill(); ctx.strokeStyle = colors.line; ctx.lineWidth = 2; ctx.stroke()
    const x = PAD + 40; let cy = y + 58
    ctx.font = font(800, 24); ctx.fillStyle = hike.kind === 'trek' ? colors.sun : colors.teal
    ctx.fillText(hike.kind === 'trek' ? 'PUNE TREKKERS TREK' : `MEMBER HIKE · BY ${hike.by.toUpperCase()}`, x, cy)
    ctx.font = font(800, titleSize); ctx.fillStyle = colors.white
    for (const line of lines) { cy += titleSize + 10; ctx.fillText(line, x, cy) }
    ctx.font = font(600, 30); ctx.fillStyle = colors.soft
    ctx.fillText([day(hike.date, { weekday: 'short', day: 'numeric', month: 'short' }), formatTime(hike.startTime), hike.difficulty === 'To be confirmed' ? '' : hike.difficulty, hike.cost].filter(Boolean).join('  ·  '), x, cy + 48)
    y += height + gap
  }
  if (extra) { ctx.font = font(800, 34); ctx.fillStyle = colors.sun; ctx.fillText(`+ ${extra} more on the website`, PAD, y + 30) }
  if (!hikes.length) {
    ctx.font = font(800, 56); ctx.fillStyle = colors.white
    wrap(ctx, 'Nothing listed yet. Heading out? Share your plan and find company.', W - PAD * 2, 4).forEach((line, i) => ctx.fillText(line, PAD, y + 60 + i * 72))
  }

  // Sticker zone: Instagram links aren't clickable as text, so this points people at the link sticker placed here.
  ctx.font = font(800, 40); ctx.fillStyle = colors.white; ctx.textAlign = 'center'
  ctx.fillText('Tap the link to join 👇', W / 2, 1470)
  ctx.font = font(600, 30); ctx.fillStyle = colors.soft; ctx.fillText(`${siteHost}/treks`, W / 2, 1518)
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not draw the story image.')), 'image/png'))
}
