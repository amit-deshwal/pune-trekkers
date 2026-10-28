// A clay-style trekker sitting on a rock, built from primitives so it costs no model download.
// It breathes, blinks, follows the pointer, waves on hover, hops when poked, and fills quiet moments on its own
// (looks around, sips water, hums, stretches, eventually dozes off). Same performance rules as HeroScene: ~30fps,
// paused in hidden tabs, and a single still frame for reduced-motion users.

import type { BufferGeometry, Material, Object3D } from 'three'

type Three = typeof import('three')
type V3 = [number, number, number]

export type Act = 'idle' | 'enter' | 'wave' | 'cheer' | 'sip' | 'stretch' | 'look' | 'hum' | 'whoa' | 'dizzy' | 'sleep' | 'wake'
export type Companion = { poke: () => void; hover: () => void; setAttention: (on: boolean) => void; setMusic: (on: boolean) => void; dispose: () => void }

const LENGTH: Partial<Record<Act, number>> = { enter: 1.1, wave: 1.9, cheer: 1.1, sip: 3.4, stretch: 2.6, look: 3.6, hum: 4.4, whoa: 1.4, dizzy: 2.8, wake: 1.1 }
const IDLE_ACTS: Act[] = ['look', 'sip', 'hum', 'stretch']
const SLEEP_AFTER = 45

// Every animatable value. Acts write targets; the loop eases the current pose toward them.
const REST = {
  hop: 0, squash: 0, torsoX: 0, torsoY: 0, torsoZ: 0, headX: 0, headY: 0, headZ: 0,
  lsX: -0.2, lsY: 0, lsZ: 0.3, leX: -0.95, leY: 0.5, leZ: 0,
  rsX: -0.2, rsY: 0, rsZ: -0.3, reX: -0.95, reY: -0.5, reZ: 0,
  eyes: 1, mouth: 0, bottle: 0,
}
type Pose = typeof REST
const DIRECT: (keyof Pose)[] = ['hop', 'squash', 'eyes']

const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v))
const bump = (p: number) => Math.sin(Math.PI * clamp(p, 0, 1))
const window01 = (p: number, a: number, b: number) => clamp((p - a) / 0.12, 0, 1) * clamp((b - p) / 0.12, 0, 1)

export function buildCompanion(THREE: Three, host: HTMLElement, onAct: (act: Act) => void, onReady: () => void): Companion | null {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvas = document.createElement('canvas')
  let renderer: InstanceType<Three['WebGLRenderer']>
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }) } catch { return null }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  host.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(21, 1, 0.1, 40)
  camera.position.set(0, 2.3, 10.5)
  const hemi = new THREE.HemisphereLight(0xfff4e8, 0x5d6f63, 1.5)
  const key = new THREE.DirectionalLight(0xfff0dc, 2.1)
  key.position.set(-4, 6, 6)
  const rim = new THREE.DirectionalLight(0xd2ecff, 1.1)
  rim.position.set(4, 3, -5)
  scene.add(hemi, key, rim)

  // ---------- Construction helpers ----------
  const materials = new Map<string, InstanceType<Three['MeshStandardMaterial']>>()
  const mat = (color: string, roughness = 0.82) => {
    const id = color + roughness
    if (!materials.has(id)) materials.set(id, new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }))
    return materials.get(id)!
  }
  type Parent = Object3D
  type Mat = Material
  const add = (parent: Parent, geo: BufferGeometry, material: Mat, at: V3 = [0, 0, 0], scale: V3 = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(...at); mesh.scale.set(...scale)
    parent.add(mesh)
    return mesh
  }
  const group = (parent: Parent, at: V3 = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...at); parent.add(g); return g }
  const ball = (r: number) => new THREE.SphereGeometry(r, 20, 14)
  const Y = new THREE.Vector3(0, 1, 0)
  // A capsule (or stretched ball) spanning two points: the basic clay "sausage" for limbs and shoes.
  const span = (parent: Parent, a: V3, b: V3, r: number, material: Mat) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), dir = to.clone().sub(from)
    const mesh = add(parent, new THREE.CapsuleGeometry(r, Math.max(0.001, dir.length()), 6, 14), material)
    mesh.position.copy(from).add(to).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(Y, dir.normalize())
    return mesh
  }

  const skin = mat('#b8764c'), hoodie = mat('#d86a2b'), hoodieDark = mat('#c25a20'), pants = mat('#3e5b45')
  const pack = mat('#6c8553'), strap = mat('#34503a'), cream = mat('#ece4cf'), sole = mat('#cbbd9c'), hair = mat('#3a2821', 0.9)
  const ink = mat('#1d1512', 0.4), white = new THREE.MeshBasicMaterial({ color: 0xffffff }), blush = mat('#e98a76')

  // stage = rock + character (rises in on entry); body = character only (hops off the rock).
  const stage = group(scene)
  stage.rotation.y = -0.28

  // Rock: a faceted, lumpy icosphere.
  const rockGeo = new THREE.IcosahedronGeometry(1, 3)
  const rp = rockGeo.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < rp.count; i++) {
    v.fromBufferAttribute(rp, i)
    const n = Math.sin(v.x * 3.1 + 1.3) * Math.sin(v.y * 2.7 + 0.4) * Math.sin(v.z * 3.3 + 2) + 0.4 * Math.sin(v.x * 7.3 + v.z * 5.1)
    v.multiplyScalar(1 + n * 0.09)
    rp.setXYZ(i, v.x, v.y, v.z)
  }
  rockGeo.computeVertexNormals()
  add(stage, rockGeo, new THREE.MeshStandardMaterial({ color: '#56595a', roughness: 0.96, flatShading: true }), [0, -0.36, 0.05], [1.3, 0.66, 1.08])

  const body = group(stage, [0, 0.3, 0])

  // Crossed legs and chunky trail shoes.
  span(body, [-0.22, 0.16, 0], [-0.64, 0.13, 0.38], 0.2, pants)
  span(body, [-0.64, 0.13, 0.38], [0.12, 0.1, 0.68], 0.19, pants)
  span(body, [0.22, 0.16, 0], [0.64, 0.15, 0.38], 0.2, pants)
  span(body, [0.64, 0.15, 0.38], [-0.12, 0.2, 0.62], 0.19, pants)
  for (const [sx, y] of [[1, 0.0], [-1, 0.06]] as const) {
    span(body, [sx * 0.26, y + 0.02, 0.72], [sx * 0.52, y + 0.06, 0.9], 0.15, cream)
    span(body, [sx * 0.26, y - 0.08, 0.72], [sx * 0.53, y - 0.04, 0.92], 0.135, sole).scale.set(1.12, 1, 1.12)
    for (let k = 0; k < 3; k++) span(body, [sx * (0.3 + k * 0.07) - 0.05 * sx, y + 0.17, 0.75 + k * 0.05], [sx * (0.3 + k * 0.07) + 0.05 * sx, y + 0.16, 0.8 + k * 0.05], 0.016, strap)
  }

  // Torso pivots at the hips so leaning and swaying carry the head and arms along.
  const torso = group(body, [0, 0.18, -0.04])
  const chest = group(torso)
  add(chest, new THREE.CapsuleGeometry(0.4, 0.36, 8, 18), hoodie, [0, 0.44, 0], [1.08, 1, 0.86])
  add(chest, new THREE.CapsuleGeometry(0.1, 0.42, 6, 12), hoodieDark, [0, 0.3, 0.3], [1, 1, 0.5]).rotation.z = Math.PI / 2
  const hood = add(chest, new THREE.TorusGeometry(0.25, 0.11, 10, 24), hoodie, [0, 0.96, -0.02])
  hood.rotation.x = Math.PI / 2 - 0.25
  add(chest, ball(0.3), hoodie, [0, 0.9, -0.26], [1.1, 0.85, 0.6])
  for (const sx of [-1, 1]) {
    span(chest, [sx * 0.08, 0.86, 0.3], [sx * 0.09, 0.62, 0.36], 0.014, cream)
    add(chest, ball(0.03), cream, [sx * 0.09, 0.6, 0.36])
    span(chest, [sx * 0.24, 0.96, 0.12], [sx * 0.3, 0.32, 0.31], 0.045, strap)
  }
  // Backpack with a rolled top and a side pocket.
  add(chest, new THREE.CapsuleGeometry(0.28, 0.32, 8, 16), pack, [0, 0.56, -0.42], [1.2, 1, 0.62])
  add(chest, new THREE.CapsuleGeometry(0.09, 0.42, 6, 12), strap, [0, 0.93, -0.42], [1, 1, 1]).rotation.z = Math.PI / 2
  add(chest, ball(0.12), pack, [0.36, 0.42, -0.36], [0.7, 1, 0.9])

  // Head pivots at the neck.
  const head = group(torso, [0, 1.0, 0.02])
  head.scale.setScalar(1.12)
  add(head, ball(0.44), skin, [0, 0.42, 0], [1.05, 0.98, 0.95])
  for (const sx of [-1, 1]) add(head, ball(0.09), skin, [sx * 0.44, 0.4, 0], [0.55, 1, 0.8])
  const HAIR: [number, number, number, number][] = [
    [0, 1, 0.05, 0.2], [0.42, 0.85, 0.15, 0.18], [-0.42, 0.85, 0.15, 0.18], [0.18, 0.8, 0.5, 0.17], [-0.24, 0.76, 0.55, 0.17],
    [0.05, 0.62, 0.72, 0.15], [0.55, 0.58, 0.38, 0.15], [-0.58, 0.58, 0.35, 0.15], [0.7, 0.5, -0.2, 0.17], [-0.7, 0.5, -0.2, 0.17],
    [0, 0.72, -0.6, 0.2], [0.42, 0.45, -0.72, 0.18], [-0.42, 0.45, -0.72, 0.18], [0, 0.28, -0.92, 0.18], [0.66, 0.2, -0.55, 0.15], [-0.66, 0.2, -0.55, 0.15],
  ]
  for (const [x, y, z, r] of HAIR) {
    const d = new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.42)
    add(head, ball(r), hair, [d.x, 0.42 + d.y, d.z], [1.15, 0.85, 1.05])
  }
  add(head, ball(0.08), hair, [0.1, 0.92, 0.12], [1, 1.4, 0.8]).rotation.z = -0.5
  add(head, ball(0.07), hair, [-0.14, 0.9, 0.05], [1, 1.3, 0.8]).rotation.z = 0.6

  // Eyes are scaled one by one (scaling the group would slide them down the face as they close).
  const eyes = group(head), pupils: Parent[] = [], glints: Parent[] = []
  for (const sx of [-1, 1]) {
    pupils.push(add(eyes, ball(0.055), ink, [sx * 0.15, 0.47, 0.39], [1, 1.15, 0.5]))
    glints.push(add(eyes, ball(0.017), white, [sx * 0.15 + 0.018, 0.495, 0.415]))
    add(head, ball(0.075), blush, [sx * 0.26, 0.34, 0.34], [1, 0.65, 0.4])
  }
  const smile = add(head, new THREE.TorusGeometry(0.065, 0.014, 6, 16, Math.PI), ink, [0, 0.33, 0.42])
  smile.rotation.z = Math.PI
  const mouthOpen = add(head, ball(0.06), mat('#4a201b', 0.6), [0, 0.31, 0.405], [1, 1, 0.45])

  // Headlamp, switched on at night: a glowing lens on the forehead (the strap hides under the hair).
  const lamp = group(head)
  add(lamp, new THREE.CylinderGeometry(0.06, 0.065, 0.06, 16), ink, [0, 0.61, 0.47]).rotation.x = Math.PI / 2 - 0.2
  add(lamp, new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), [0, 0.61, 0.505]).rotation.x = -0.2
  const glow = add(lamp, new THREE.CircleGeometry(0.11, 24), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), [0, 0.61, 0.52])
  glow.rotation.x = -0.2
  // Night (the clock, or the dark theme) swaps warm daylight for cool moonlight with a stronger rim, so the figure
  // still reads against a dark page, and switches the headlamp on. Follows <html data-phase> as it changes.
  const light = () => {
    const night = document.documentElement.dataset.phase === 'night'
    lamp.visible = night
    hemi.color.set(night ? 0xa9bbe6 : 0xfff4e8); hemi.groundColor.set(night ? 0x1f2b3a : 0x5d6f63); hemi.intensity = night ? 1.05 : 1.5
    key.color.set(night ? 0xc6d4ff : 0xfff0dc); key.intensity = night ? 1.25 : 2.1
    rim.color.set(night ? 0x9cc0ff : 0xd2ecff); rim.intensity = night ? 1.9 : 1.1
  }
  light()

  // Arms: shoulder → elbow → hand, with a water bottle in the right hand for sipping.
  const arm = (sx: number) => {
    const shoulder = group(chest, [sx * 0.43, 0.84, 0.02])
    add(shoulder, ball(0.15), hoodie, [0, -0.02, 0])
    span(shoulder, [0, 0, 0], [0, -0.36, 0], 0.13, hoodie)
    const elbow = group(shoulder, [0, -0.36, 0])
    span(elbow, [0, 0, 0], [0, -0.26, 0], 0.12, hoodie)
    add(elbow, new THREE.TorusGeometry(0.1, 0.04, 8, 16), hoodieDark, [0, -0.29, 0]).rotation.x = Math.PI / 2
    const hand = group(elbow, [0, -0.38, 0])
    add(hand, ball(0.11), skin, [0, 0, 0], [1, 1.05, 0.9])
    return { shoulder, elbow, hand }
  }
  const L = arm(-1), R = arm(1)
  // The bottle is held up to the mouth in head space, so it always meets the lips whatever the arm is doing.
  const bottle = group(head, [0.03, 0.3, 0.46])
  add(bottle, new THREE.CylinderGeometry(0.085, 0.085, 0.34, 16), mat('#2fa58f', 0.5), [0, -0.2, 0])
  add(bottle, new THREE.CylinderGeometry(0.05, 0.05, 0.07, 12), mat('#f08a3c', 0.6), [0, 0, 0])
  bottle.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0.7, 0.35, 0.62).normalize())

  // ---------- Behaviour ----------
  const cur: Pose = { ...REST }, tgt: Pose = { ...REST }
  let act: Act = reduce ? 'idle' : 'enter', actAt = performance.now() / 1000, nextIdle = actAt + 8, lastIdle: Act = 'idle'
  let lastActivity = actAt, lastWave = 0, lastWhoa = 0, nextBlink = actAt + 2, blinkUntil = 0, attention = false, music = false
  let pokes: number[] = []
  const pointer = { x: NaN, y: NaN }
  const look = { yaw: 0.28, pitch: 0 }
  let scrollY = window.scrollY, scrollAt = performance.now(), scrollSpeed = 0
  const now = () => performance.now() / 1000
  const play = (next: Act) => { act = next; actAt = now(); onAct(next) }
  const busy = () => act !== 'idle' && act !== 'look' && act !== 'hum'

  const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY; activity() }
  const onScroll = () => {
    const t = performance.now(), dy = Math.abs(window.scrollY - scrollY), dt = Math.max(16, t - scrollAt)
    scrollY = window.scrollY; scrollAt = t
    scrollSpeed = scrollSpeed * 0.6 + (dy / dt) * 0.4
    activity()
    if (scrollSpeed > 4 && !busy() && now() - lastWhoa > 5) { lastWhoa = now(); play('whoa') }
  }
  const activity = () => { lastActivity = now(); if (act === 'sleep') play('wake') }

  function pose(t: number) {
    Object.assign(tgt, REST)
    const s = t - actAt, p = s / (LENGTH[act] ?? 1)

    // Pointer tracking: head (and a little of the torso) turns toward the cursor or a recent tap.
    if (!Number.isNaN(pointer.x)) {
      const r = host.getBoundingClientRect()
      look.yaw = clamp((pointer.x - (r.left + r.width / 2)) / (window.innerWidth * 0.35)) * 0.8 + 0.28
      look.pitch = clamp((pointer.y - (r.top + r.height * 0.3)) / (window.innerHeight * 0.45)) * 0.42
    }
    let yaw = attention ? -0.25 : look.yaw, pitch = attention ? -0.1 : look.pitch
    if (act === 'look') { yaw = Math.sin(s * 1.8) * 0.75; pitch = -0.12 }
    tgt.headY = clamp(yaw, -0.85, 0.85) * 0.75; tgt.torsoY = clamp(yaw, -0.85, 0.85) * 0.22
    tgt.headX = pitch; tgt.headZ = -yaw * 0.06

    switch (act) {
      case 'enter':
        tgt.squash = s > 0.75 ? bump((s - 0.75) / 0.3) * 0.08 : 0
        tgt.mouth = 0.6; tgt.eyes = 1.15
        break
      case 'wave':
        tgt.lsX = -0.15; tgt.lsY = 0.2; tgt.lsZ = -2.45; tgt.leX = -0.1; tgt.leZ = -0.35 + Math.sin(s * 10) * 0.42 * window01(p, 0, 1)
        tgt.headZ = -0.14; tgt.mouth = 0.45
        break
      case 'cheer':
        tgt.hop = bump(s / 0.5) * 0.45; tgt.squash = s < 0.08 ? 0.1 : s > 0.5 && s < 0.7 ? 0.08 : -bump(s / 0.5) * 0.05
        tgt.lsX = -0.2; tgt.lsZ = -2.75; tgt.leX = 0; tgt.leZ = -0.3; tgt.rsX = -0.2; tgt.rsZ = 2.75; tgt.reX = 0; tgt.reZ = 0.3
        tgt.mouth = 1; tgt.eyes = 1.2; tgt.headX = -0.18
        break
      case 'sip': {
        const k = window01(p, 0.05, 0.95)
        tgt.bottle = k
        tgt.rsX = REST.rsX + (-1.75 - REST.rsX) * k; tgt.rsZ = REST.rsZ + (0.35 - REST.rsZ) * k; tgt.reX = REST.reX + (-1.0 - REST.reX) * k; tgt.reY = REST.reY * (1 - k)
        const drink = window01(p, 0.35, 0.75)
        tgt.headX = pitch * (1 - k) - 0.38 * drink; tgt.rsX -= 0.3 * drink; tgt.eyes = 1 - 0.85 * drink
        break
      }
      case 'stretch': {
        const k = window01(p, 0.05, 0.85)
        tgt.lsX = REST.lsX + (-0.15 - REST.lsX) * k; tgt.lsZ = REST.lsZ + (-2.9 - REST.lsZ) * k; tgt.leX = REST.leX * (1 - k)
        tgt.rsX = REST.rsX + (-0.15 - REST.rsX) * k; tgt.rsZ = REST.rsZ + (2.9 - REST.rsZ) * k; tgt.reX = REST.reX * (1 - k)
        tgt.torsoX = -0.12 * k; tgt.headX = -0.3 * k; tgt.mouth = 1.3 * window01(p, 0.15, 0.7); tgt.eyes = 1 - 0.9 * k
        break
      }
      case 'hum':
        tgt.torsoZ = Math.sin(s * 3.6) * 0.1; tgt.headZ = Math.sin(s * 3.6 + 0.7) * 0.18; tgt.headX = -0.08
        tgt.eyes = 0.15; tgt.mouth = 0.25 + 0.2 * Math.max(0, Math.sin(s * 7.2))
        break
      case 'whoa':
        tgt.torsoX = -0.22; tgt.headX = -0.1; tgt.lsX = 0.25; tgt.lsZ = -1.1; tgt.leX = -0.4; tgt.rsX = 0.25; tgt.rsZ = 1.1; tgt.reX = -0.4
        tgt.eyes = 1.35; tgt.mouth = 1; tgt.hop = Math.abs(Math.sin(s * 30)) * 0.04 * (1 - p)
        break
      case 'dizzy':
        tgt.headX = Math.cos(s * 7) * 0.16; tgt.headZ = Math.sin(s * 7) * 0.24; tgt.torsoZ = Math.sin(s * 7 + 1) * 0.07
        tgt.eyes = 0.3; tgt.mouth = 0.55
        break
      case 'sleep':
        tgt.headX = 0.45; tgt.headY = 0.1; tgt.headZ = 0.22; tgt.torsoX = 0.1; tgt.torsoY = 0; tgt.eyes = 0.06; tgt.mouth = 0.15 + 0.12 * Math.sin(t * 1.3)
        break
      case 'wake':
        tgt.hop = bump(s / 0.35) * 0.2; tgt.eyes = 1.4; tgt.mouth = 0.9; tgt.headX = -0.12
        break
    }
    // With music on, nod along to the track's 122 bpm.
    if (music && act !== 'sleep') tgt.headX += Math.sin(t * Math.PI * 2 * (122 / 60)) * 0.035
    // Breathing, and blinks unless the eyes are already doing something.
    chest.scale.set(1, 1 + (act === 'sleep' ? 0.03 * Math.sin(t * 1.3) : 0.016 * Math.sin(t * 2.3)), 1)
    if (t > nextBlink) { blinkUntil = t + 0.13; nextBlink = t + 2 + Math.random() * 3.5; if (Math.random() < 0.2) nextBlink = t + 0.3 }
    if (t < blinkUntil && tgt.eyes > 0.5) tgt.eyes = 0.08
  }

  function schedule(t: number) {
    const len = LENGTH[act]
    if (len && t - actAt > len) {
      if (act === 'enter') { lastWave = t; return play('wave') }
      play('idle'); nextIdle = t + 7 + Math.random() * 6
    }
    if (act !== 'idle') return
    if (t - lastActivity > SLEEP_AFTER) return play('sleep')
    if (t > nextIdle) {
      const options = IDLE_ACTS.filter(a => a !== lastIdle)
      lastIdle = music && Math.random() < 0.6 ? 'hum' : options[Math.floor(Math.random() * options.length)]
      play(lastIdle)
    }
  }

  function apply(t: number, dt: number) {
    const k = 1 - Math.exp(-dt * 11)
    for (const key of Object.keys(REST) as (keyof Pose)[]) cur[key] = DIRECT.includes(key) ? tgt[key] : cur[key] + (tgt[key] - cur[key]) * k
    if (act === 'enter') stage.position.y = -3.4 * Math.pow(1 - clamp((t - actAt) / 0.75, 0, 1), 3) + Math.sin(clamp((t - actAt) / 0.75, 0, 1) * Math.PI) * 0.12
    else stage.position.y = 0
    body.position.y = 0.3 + cur.hop
    body.scale.set(1 + cur.squash * 0.6, 1 - cur.squash, 1 + cur.squash * 0.6)
    torso.rotation.set(cur.torsoX, cur.torsoY, cur.torsoZ)
    head.rotation.set(cur.headX, cur.headY, cur.headZ)
    L.shoulder.rotation.set(cur.lsX, cur.lsY, cur.lsZ); L.elbow.rotation.set(cur.leX, cur.leY, cur.leZ)
    R.shoulder.rotation.set(cur.rsX, cur.rsY, cur.rsZ); R.elbow.rotation.set(cur.reX, cur.reY, cur.reZ)
    for (const pupil of pupils) pupil.scale.y = 1.15 * Math.max(0.05, cur.eyes)
    for (const glint of glints) glint.visible = cur.eyes > 0.5
    eyes.position.set(clamp(cur.headY, -0.3, 0.3) * 0.04, -cur.headX * 0.02, 0)
    smile.scale.setScalar(Math.max(0.001, 1 - cur.mouth)); mouthOpen.scale.set(cur.mouth, cur.mouth, cur.mouth * 0.45)
    bottle.visible = cur.bottle > 0.2; bottle.scale.setScalar(Math.max(0.001, cur.bottle))
    if (lamp.visible) glow.scale.setScalar(1 + Math.sin(t * 2.1) * 0.08)
  }

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    camera.lookAt(0, 1.05, 0)
  }
  let last = 0
  const frame = (ms: number) => {
    const t = ms / 1000, dt = last ? Math.min(0.1, t - last) : 1 / 30
    last = t
    if (!reduce) schedule(t)
    pose(t)
    apply(t, reduce ? 1 : dt)
    renderer.render(scene, camera)
  }

  const ro = new ResizeObserver(() => { resize(); if (reduce) frame(performance.now()) })
  const mo = new MutationObserver(() => { light(); if (reduce) frame(performance.now()) })

  let raf = 0, drawn = 0, disposed = false
  const tick = (ms: number) => {
    raf = 0
    if (document.hidden) return
    if (ms - drawn >= (act === 'sleep' ? 66 : 33)) { drawn = ms; frame(ms) }
    raf = requestAnimationFrame(tick)
  }
  const wake = () => { if (!reduce && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(tick) } }
  // Shaders compile in the background (where the GPU driver allows) before the first frame, instead of stalling it.
  renderer.compileAsync(scene, camera).catch(() => {}).then(() => {
    if (disposed) return
    resize()
    frame(performance.now())
    requestAnimationFrame(onReady)
    if (!reduce) onAct(act)
    ro.observe(host)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-phase'] })
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onMove, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('keydown', activity)
      document.addEventListener('visibilitychange', wake)
      wake()
    }
  })

  return {
    poke() {
      if (reduce) return
      const t = now()
      lastActivity = t
      if (act === 'sleep') return play('wake')
      pokes = [...pokes.filter(x => t - x < 2.5), t]
      if (pokes.length >= 5) { pokes = []; return play('dizzy') }
      if (act !== 'dizzy') play('cheer')
    },
    hover() {
      if (reduce) return
      const t = now()
      lastActivity = t
      if (act === 'sleep') return play('wake')
      if (!busy() && t - lastWave > 6) { lastWave = t; play('wave') }
    },
    setAttention(on) { attention = on; if (reduce) frame(performance.now()) },
    setMusic(on) {
      if (on && !music && !reduce && !busy()) { lastActivity = now(); if (act !== 'enter') play('hum') }
      music = on
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect()
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onMove)
      window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', activity)
      document.removeEventListener('visibilitychange', wake)
      scene.traverse(obj => { (obj as InstanceType<Three['Mesh']>).geometry?.dispose() })
      materials.forEach(m => m.dispose())
      scene.traverse(obj => { const m = (obj as InstanceType<Three['Mesh']>).material; if (m && !Array.isArray(m)) m.dispose() })
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove()
    },
  }
}
