/**
 * PointCloud — R3F BufferGeometry-based scatter plot.
 *
 * Rendering differences by mode
 * ─────────────────────────────
 * RAW / KMEANS / DBSCAN
 *   AdditiveBlending — classic neon cyberpunk look, all points equal weight.
 *
 * ATTACK
 *   NormalBlending  — prevents color addition washing everything to white/cyan.
 *   Per-vertex alpha baked via attackRenderWeight():
 *     BENIGN  → alphaMult 0.18, sizeMult 0.55  (dim background context)
 *     Attacks → alphaMult 1.0,  sizeMult 1.25  (vivid foreground)
 */
import { useRef, useMemo, useCallback } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { ExplorerPoint, VisualizationMode } from '../../data/explorerApi'
import {
  KMEANS_COLORS, ATTACK_COLORS, DBSCAN_NOISE_COLOR, DBSCAN_CORE_COLORS,
  featureExtent, normalizeToScene, attackRenderWeight,
} from '../../data/explorerApi'

// ── Props ─────────────────────────────────────────────────────────────────

export interface PointCloudProps {
  points:      ExplorerPoint[]
  xFeature:    string
  yFeature:    string
  zFeature:    string
  sizeFeature: string
  mode:        VisualizationMode
  hoveredId:   number | null
  selectedId:  number | null
  onHover:     (id: number | null) => void
  onSelect:    (id: number | null) => void
}

// ── Color helpers ─────────────────────────────────────────────────────────

/** Convert #rrggbb or hsl(...) → [r, g, b] in 0–1 range */
function hexToRGB(hex: string): [number, number, number] {
  if (hex.startsWith('hsl')) {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = hex
    const c = ctx.fillStyle
    const n = parseInt(c.replace('#', ''), 16)
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
  }
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

function getPointColor(p: ExplorerPoint, mode: VisualizationMode): string {
  switch (mode) {
    case 'KMEANS': return KMEANS_COLORS[p.kmeans] ?? '#ffffff'
    case 'DBSCAN': return p.dbscan === -1
      ? DBSCAN_NOISE_COLOR
      : (DBSCAN_CORE_COLORS[p.dbscan % DBSCAN_CORE_COLORS.length] ?? '#ffffff')
    case 'ATTACK': return ATTACK_COLORS[p.label.trim()] ?? '#aaaaaa'
    case 'RAW':
    default:       return '#00d4ff'
  }
}

// ── Shader sources ────────────────────────────────────────────────────────

// Shared vertex shader — reads per-vertex `size` and `alpha` attributes
const VERT = /* glsl */`
  attribute float size;
  attribute float alpha;
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`

// Soft-disk fragment — uses per-vertex alpha instead of a uniform
const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    // Additive mode: tight core only to avoid color bleed
    // Normal mode: wider, softer disk for readable distinct colors
    float edge = 0.45;
    float core = 0.05;
    float a = smoothstep(edge, core, d) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`

// ── Component ─────────────────────────────────────────────────────────────

export default function PointCloud({
  points, xFeature, yFeature, zFeature, sizeFeature,
  mode, hoveredId, selectedId, onHover, onSelect,
}: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const isAttackMode = mode === 'ATTACK'

  // ── Material — rebuilt when blending mode changes ───────────────────────
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexColors: true,
    transparent:  true,
    depthWrite:   false,
    blending:     isAttackMode ? THREE.NormalBlending : THREE.AdditiveBlending,
    vertexShader:   VERT,
    fragmentShader: FRAG,
  }), [isAttackMode])

  // ── Build geometry buffers ──────────────────────────────────────────────
  const { positions, colors, sizes, alphas, baseColors, baseSizes, baseAlphas } = useMemo(() => {
    const xE = featureExtent(points, xFeature)
    const yE = featureExtent(points, yFeature)
    const zE = featureExtent(points, zFeature)
    const sE = featureExtent(points, sizeFeature)

    const n = points.length
    const positions  = new Float32Array(n * 3)
    const colors     = new Float32Array(n * 3)
    const sizes      = new Float32Array(n)
    const alphas     = new Float32Array(n)
    const baseColors = new Float32Array(n * 3)
    const baseSizes  = new Float32Array(n)
    const baseAlphas = new Float32Array(n)

    points.forEach((p, i) => {
      // Position
      positions[i * 3]     = normalizeToScene(p.features[xFeature] ?? 0, ...xE)
      positions[i * 3 + 1] = normalizeToScene(p.features[yFeature] ?? 0, ...yE)
      positions[i * 3 + 2] = normalizeToScene(p.features[zFeature] ?? 0, ...zE)

      // Color
      const [r, g, b] = hexToRGB(getPointColor(p, mode))
      colors[i * 3]       = r;  colors[i * 3 + 1]       = g;  colors[i * 3 + 2]       = b
      baseColors[i * 3]   = r;  baseColors[i * 3 + 1]   = g;  baseColors[i * 3 + 2]   = b

      // Size — base range 3–12 px, scaled by attackRenderWeight in ATTACK mode
      const normSize  = (p.features[sizeFeature] ?? 0 - sE[0]) / (sE[1] - sE[0] || 1)
      const baseSize  = 3 + normSize * 9   // 3–12 px
      const { sizeMult, alphaMult } = isAttackMode
        ? attackRenderWeight(p.label)
        : { sizeMult: 1.0, alphaMult: 0.88 }

      sizes[i]      = baseSize * sizeMult
      baseSizes[i]  = baseSize * sizeMult
      alphas[i]     = alphaMult
      baseAlphas[i] = alphaMult
    })

    return { positions, colors, sizes, alphas, baseColors, baseSizes, baseAlphas }
  }, [points, xFeature, yFeature, zFeature, sizeFeature, mode, isAttackMode])

  // ── Highlight hovered / selected per frame ──────────────────────────────
  useFrame(() => {
    const geo = pointsRef.current?.geometry
    if (!geo) return
    const colAttr   = geo.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr  = geo.getAttribute('size')  as THREE.BufferAttribute
    const alphaAttr = geo.getAttribute('alpha') as THREE.BufferAttribute
    if (!colAttr || !sizeAttr || !alphaAttr) return

    let needsColor = false
    let needsSize  = false
    let needsAlpha = false

    points.forEach((p, i) => {
      const isHov = p.id === hoveredId
      const isSel = p.id === selectedId

      // ── Color: white-flash on hover/select ───────────────────────────
      const tR = isSel ? 1.0 : isHov ? 1.0 : baseColors[i * 3]
      const tG = isSel ? 1.0 : isHov ? 0.9 : baseColors[i * 3 + 1]
      const tB = isSel ? 1.0 : isHov ? 0.5 : baseColors[i * 3 + 2]

      if (Math.abs(colAttr.getX(i) - tR) > 0.001 ||
          Math.abs(colAttr.getY(i) - tG) > 0.001 ||
          Math.abs(colAttr.getZ(i) - tB) > 0.001) {
        colAttr.setXYZ(i, tR, tG, tB)
        needsColor = true
      }

      // ── Size: enlarge on hover/select ────────────────────────────────
      const tSize = isSel ? baseSizes[i] * 2.8 : isHov ? baseSizes[i] * 2.0 : baseSizes[i]
      if (Math.abs(sizeAttr.getX(i) - tSize) > 0.1) {
        sizeAttr.setX(i, tSize)
        needsSize = true
      }

      // ── Alpha: boost on hover/select; restore base otherwise ─────────
      const tAlpha = (isSel || isHov) ? 1.0 : baseAlphas[i]
      if (Math.abs(alphaAttr.getX(i) - tAlpha) > 0.005) {
        alphaAttr.setX(i, tAlpha)
        needsAlpha = true
      }
    })

    if (needsColor) colAttr.needsUpdate   = true
    if (needsSize)  sizeAttr.needsUpdate  = true
    if (needsAlpha) alphaAttr.needsUpdate = true
  })

  // ── Pointer events ────────────────────────────────────────────────────
  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const idx = e.index
    onHover(idx != null ? (points[idx]?.id ?? null) : null)
  }, [points, onHover])

  const handlePointerOut = useCallback(() => onHover(null), [onHover])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const idx = e.index
    if (idx == null) return
    const clickedId = points[idx]?.id ?? null
    onSelect(clickedId === selectedId ? null : clickedId)
  }, [points, selectedId, onSelect])

  return (
    <points
      ref={pointsRef}
      material={material}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
        <bufferAttribute attach="attributes-size"     args={[sizes, 1]}     />
        <bufferAttribute attach="attributes-alpha"    args={[alphas, 1]}    />
      </bufferGeometry>
    </points>
  )
}
