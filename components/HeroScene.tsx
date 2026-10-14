import { useEffect, useRef, useState } from 'react'
import type { Phase } from '../lib/phase'

// A ridged Sahyadri-style massif with a dotted route and waypoint pins.
// Performance rules: three.js is a separate chunk loaded when the browser is idle; rendering is capped at ~30fps and
// pixel ratio 1.5; the loop pauses off-screen and in hidden tabs; reduced-motion users get a single still frame;
// data-saver users and browsers without WebGL keep the static poster.

type Three = typeof import('three')

// Seeded 2D gradient noise (Perlin-style). Unlike layered sines it never repeats, so ridgelines look natural.
const PERM = new Uint8Array(512)
{
  const p = Array.from({ length: 256 }, (_, i) => i)
  let s = 1337
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]] }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
}
const GRAD = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]]
function noise(x: number, z: number) {
  const X = Math.floor(x), Z = Math.floor(z), fx = x - X, fz = z - Z, xi = X & 255, zi = Z & 255
  const g = (ix: number, iz: number, dx: number, dz: number) => { const v = GRAD[PERM[PERM[ix] + iz] & 7]; return v[0] * dx + v[1] * dz }
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fz * fz * fz * (fz * (fz * 6 - 15) + 10)
  const a = g(xi, zi, fx, fz) + u * (g(xi + 1, zi, fx - 1, fz) - g(xi, zi, fx, fz))
  const b = g(xi, zi + 1, fx, fz - 1) + u * (g(xi + 1, zi + 1, fx - 1, fz - 1) - g(xi, zi + 1, fx, fz - 1))
  return a + v * (b - a)
}
// Ridged multifractal: sharp crests where the noise crosses zero, with detail concentrated on the ridges.
function ridgedFbm(x: number, z: number) {
  let sum = 0, amp = 0.5, f = 1, w = 1
  for (let i = 0; i < 5; i++) {
    let n = 1 - Math.abs(noise(x * f, z * f)) * 1.4
    n *= n; n *= w; w = Math.max(0, Math.min(1, n * 2))
    sum += n * amp; f *= 2.1; amp *= 0.5
  }
  return sum
}
function fbm(x: number, z: number) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f, z * f); a *= 0.5; f *= 2 } return s }
const smooth = (e0: number, e1: number, v: number) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
const cone = (x: number, z: number, px: number, pz: number, r: number) => Math.pow(Math.max(0, 1 - Math.hypot(x - px, z - pz) / r), 1.3)

// Steep pyramid-like peaks carved by ridged noise, gentle rolling ground, and distant ranges on the horizon.
function height(x: number, z: number) {
  let h = -0.3
  h += 6.0 * cone(x, z, 1.1, -1.3, 6.4) * (0.72 + 0.42 * ridgedFbm(x * 0.3 + 11, z * 0.3 + 4))
  h += 2.6 * cone(x, z, -3.6, 0.1, 3.8) * (0.55 + 0.6 * ridgedFbm(x * 0.35 + 23, z * 0.35 + 9))
  h += 2.8 * cone(x, z, 4.9, 0.9, 3.6) * (0.55 + 0.6 * ridgedFbm(x * 0.35 + 41, z * 0.35 + 17))
  h += 0.4 * fbm(x * 0.35 + 5, z * 0.35)
  h += smooth(-6, -13, z) * (0.6 + 4.4 * ridgedFbm(x * 0.17 + 30, z * 0.17))
  h += smooth(8, 14, Math.abs(x)) * (0.4 + 2.6 * ridgedFbm(x * 0.2, z * 0.2 + 50))
  return h
}

// Light, fog and tint per time of day. The sky, sun/moon and stars are CSS (see globals.css), so 3D only handles light.
const MOODS: Record<Phase, { sky: number; ground: number; hemi: number; sun: number; sunI: number; pos: [number, number, number]; fog: number; tint: number }> = {
  morning: { sky: 0xfff0e6, ground: 0x1b5a50, hemi: 0.75, sun: 0xffe2c4, sunI: 1.9, pos: [-6, 3.2, 5], fog: 0xe6d9cc, tint: 0xffffff },
  afternoon: { sky: 0xe8f4ff, ground: 0x2a6a60, hemi: 0.95, sun: 0xffffff, sunI: 2.2, pos: [2, 9, 4], fog: 0xcfe6ee, tint: 0xffffff },
  evening: { sky: 0xffb59a, ground: 0x3a3a5a, hemi: 0.55, sun: 0xff9a55, sunI: 2.3, pos: [8, 2.4, 2], fog: 0xdb8f7d, tint: 0xffe3d4 },
  night: { sky: 0x4a63a8, ground: 0x0c1c2e, hemi: 0.6, sun: 0x9db8ff, sunI: 1.0, pos: [-4, 7, 4], fog: 0x1a2d4d, tint: 0xa6b9e0 },
}

function build(THREE: Three, host: HTMLElement, getPhase: () => Phase, onReady: () => void) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvas = document.createElement('canvas')
  let renderer: InstanceType<Three['WebGLRenderer']>
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: 'low-power' }) } catch { return { dispose: () => {}, redraw: () => {}, reduce: true } }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  host.appendChild(canvas)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xcfe3dc, 24, 52)
  const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 80)

  // Terrain, coloured by height and slope (teal valleys, pale summits, grey rock on steep faces).
  const W = 44, D = 40, SX = 240, SZ = 220
  const geometry = new THREE.PlaneGeometry(W, D, SX, SZ)
  geometry.rotateX(-Math.PI / 2)
  const pos = geometry.attributes.position
  let maxH = 0
  for (let i = 0; i < pos.count; i++) { const y = height(pos.getX(i), pos.getZ(i)); pos.setY(i, y); if (y > maxH) maxH = y }
  geometry.computeVertexNormals()
  const colors = new Float32Array(pos.count * 3)
  const normal = geometry.attributes.normal
  const low = new THREE.Color('#1b5a50'), mid = new THREE.Color('#34b39c'), snow = new THREE.Color('#f6fcf9'), rock = new THREE.Color('#546a6d'), c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, (pos.getY(i) + 0.15) / (maxH + 0.15)))
    const steep = 1 - normal.getY(i)
    c.copy(low).lerp(mid, Math.min(1, t * 1.6))
    if (t > 0.4) c.lerp(steep > 0.5 && t < 0.72 ? rock : snow, Math.min(1, (t - 0.4) * 3.5))
    else if (steep > 0.45) c.lerp(rock, 0.35)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.95, metalness: 0 }))
  scene.add(terrain)
  const hemi = new THREE.HemisphereLight(0xfff0e6, 0x16524a, 0.7)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff4e8, 1.9)
  scene.add(sun)
  // Current mood eases toward the target mood, so changing time of day fades instead of snapping.
  const mood = { sky: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color(), fog: new THREE.Color(), tint: new THREE.Color(), hemi: 0, sunI: 0, pos: new THREE.Vector3() }
  const goal = { sky: new THREE.Color(), ground: new THREE.Color(), sun: new THREE.Color(), fog: new THREE.Color(), tint: new THREE.Color(), pos: new THREE.Vector3() }
  const ease = (k: number) => {
    const t = MOODS[getPhase()]
    goal.sky.set(t.sky); goal.ground.set(t.ground); goal.sun.set(t.sun); goal.fog.set(t.fog); goal.tint.set(t.tint); goal.pos.set(...t.pos)
    mood.sky.lerp(goal.sky, k); mood.ground.lerp(goal.ground, k); mood.sun.lerp(goal.sun, k); mood.fog.lerp(goal.fog, k); mood.tint.lerp(goal.tint, k); mood.pos.lerp(goal.pos, k)
    mood.hemi += (t.hemi - mood.hemi) * k; mood.sunI += (t.sunI - mood.sunI) * k
    hemi.color.copy(mood.sky); hemi.groundColor.copy(mood.ground); hemi.intensity = mood.hemi
    sun.color.copy(mood.sun); sun.intensity = mood.sunI; sun.position.copy(mood.pos)
    ;(scene.fog as InstanceType<Three['Fog']>).color.copy(mood.fog)
    ;(terrain.material as InstanceType<Three['MeshStandardMaterial']>).color.copy(mood.tint)
  }

  // Route: a switchback line from the valley to the summit.
  const lift = (x: number, z: number) => new THREE.Vector3(x, height(x, z) + 0.07, z)
  const route = new THREE.CatmullRomCurve3([
    lift(-5.2, 3.9), lift(-3.6, 2.6), lift(-2.0, 2.9), lift(-0.9, 1.5), lift(0.4, 1.9),
    lift(0.2, 0.2), lift(1.5, -0.3), lift(0.8, -0.9), lift(1.1, -1.3),
  ])
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 110)
  const m = new THREE.Matrix4()
  // The spline sags between control points and would dip under the mesh, so re-seat every sample on the terrain.
  const onTerrain = (t: number, up: number) => { const p = route.getPointAt(t); p.y = height(p.x, p.z) + up; return p }
  for (let i = 0; i < 110; i++) { const p = onTerrain(i / 109, 0.09); m.setPosition(p.x, p.y, p.z); dots.setMatrixAt(i, m) }
  scene.add(dots)
  const walker = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff7a2f }))
  scene.add(walker)
  const pins = [0, 0.38, 0.7, 1].map((t, i) => {
    const g = new THREE.Group()
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    stem.position.y = 0.18
    const head = new THREE.Mesh(new THREE.SphereGeometry(i === 3 ? 0.13 : 0.1, 14, 14), new THREE.MeshBasicMaterial({ color: i === 3 ? 0x35d1b5 : 0xffffff }))
    head.position.y = 0.42
    g.add(stem, head)
    g.position.copy(onTerrain(t, 0.05))
    scene.add(g)
    return g
  })

  // Framing: wide panels look slightly up at the summit; near-square (mobile) panels pull back and aim lower so the
  // whole route stays above the stats card in the bottom corner.
  const target = new THREE.Vector3(-2.2, 3.2, 0.2)
  const wide = { fov: 25, target: new THREE.Vector3(-2.2, 3.2, 0.2) }, square = { fov: 27, target: new THREE.Vector3(-2.0, 2.2, 0.4) }
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const onMove = (e: PointerEvent) => { pointer.x = (e.clientX / window.innerWidth - 0.5) * 2; pointer.y = (e.clientY / window.innerHeight - 0.5) * 2 }
  if (!reduce && window.matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', onMove, { passive: true })

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const k = Math.max(0, Math.min(1, (1.3 - camera.aspect) / 0.35))
    camera.fov = wide.fov + (square.fov - wide.fov) * k
    target.lerpVectors(wide.target, square.target, k)
    camera.updateProjectionMatrix()
  }
  const draw = (time: number) => {
    ease(0.05)
    pointer.sx += (pointer.x - pointer.sx) * 0.04; pointer.sy += (pointer.y - pointer.sy) * 0.04
    const angle = 0.05 + Math.sin(time * 0.13) * 0.14 + pointer.sx * 0.1
    camera.position.set(Math.sin(angle) * 25, 8.6 + pointer.sy * 0.5, Math.cos(angle) * 25)
    camera.lookAt(target)
    const w = (time * 0.035) % 2
    walker.position.copy(onTerrain(w <= 1 ? w : 2 - w, 0.12))
    pins.forEach((p, i) => { p.children[1].position.y = 0.42 + Math.sin(time * 1.6 + i) * 0.025 })
    renderer.render(scene, camera)
  }

  resize()
  ease(1)
  draw(0)
  requestAnimationFrame(onReady)
  const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0) })
  ro.observe(host)

  let raf = 0, visible = true, last = 0
  const tick = (now: number) => {
    raf = 0
    if (!visible || document.hidden) return
    if (now - last >= 33) { last = now; draw(now / 1000) }
    raf = requestAnimationFrame(tick)
  }
  const wake = () => { if (!reduce && visible && !document.hidden && !raf) raf = requestAnimationFrame(tick) }
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake() })
  io.observe(host)
  document.addEventListener('visibilitychange', wake)
  wake()

  const redraw = () => { ease(1); draw(0) }
  const dispose = () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
    document.removeEventListener('visibilitychange', wake); window.removeEventListener('pointermove', onMove)
    scene.traverse(obj => { const mesh = obj as InstanceType<Three['Mesh']>; mesh.geometry?.dispose(); const mat = mesh.material; if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose() })
    renderer.dispose(); renderer.forceContextLoss(); canvas.remove()
  }
  return { dispose, redraw, reduce }
}

export default function HeroScene({ phase }: { phase: Phase }) {
  const host = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  const handle = useRef<ReturnType<typeof build> | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => { phaseRef.current = phase; if (handle.current?.reduce) handle.current.redraw() }, [phase])
  useEffect(() => {
    const el = host.current
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!el || saver) return
    let cancelled = false
    const start = () => { import('three').then(THREE => { if (!cancelled) handle.current = build(THREE, el, () => phaseRef.current, () => setReady(true)) }).catch(() => {}) }
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void }
    const idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 400)
    return () => { cancelled = true; if (w.requestIdleCallback) w.cancelIdleCallback?.(idle); else clearTimeout(idle); handle.current?.dispose(); handle.current = null }
  }, [])
  return <div ref={host} className={`hero-scene${ready ? ' is-ready' : ''}`} aria-hidden="true" />
}
