/**
 * SceneAxes — XYZ axis lines with feature-name labels at the tips.
 * Uses Drei's <Text> for sharp WebGL text rendering.
 */
import { Text, Line } from '@react-three/drei'

interface SceneAxesProps {
  xLabel: string
  yLabel: string
  zLabel: string
  extent?: number   // scene units from origin to tip
}

const TICK_COUNT = 5
const FONT_SIZE  = 0.22
const OPACITY    = 0.55

export default function SceneAxes({ xLabel, yLabel, zLabel, extent = 5.5 }: SceneAxesProps) {
  const e  = extent
  const te = extent + 0.5   // label position offset from tip

  return (
    <group>
      {/* ── X axis ─ cyan ─────────────────────────────────────────────── */}
      <Line
        points={[[-e, 0, 0], [e, 0, 0]]}
        color="#00d4ff"
        lineWidth={1}
        transparent opacity={OPACITY}
      />
      <Text position={[te, 0, 0]} fontSize={FONT_SIZE} color="#00d4ff"
        anchorX="left" anchorY="middle" fillOpacity={0.9}>
        {truncate(xLabel)}
      </Text>

      {/* ── Y axis ─ green ────────────────────────────────────────────── */}
      <Line
        points={[[0, -e, 0], [0, e, 0]]}
        color="#00ff88"
        lineWidth={1}
        transparent opacity={OPACITY}
      />
      <Text position={[0, te, 0]} fontSize={FONT_SIZE} color="#00ff88"
        anchorX="center" anchorY="bottom" fillOpacity={0.9}>
        {truncate(yLabel)}
      </Text>

      {/* ── Z axis ─ purple ───────────────────────────────────────────── */}
      <Line
        points={[[0, 0, -e], [0, 0, e]]}
        color="#7b2fff"
        lineWidth={1}
        transparent opacity={OPACITY}
      />
      <Text position={[0, 0, te]} fontSize={FONT_SIZE} color="#7b2fff"
        anchorX="center" anchorY="middle" fillOpacity={0.9}>
        {truncate(zLabel)}
      </Text>

      {/* ── Origin dot ────────────────────────────────────────────────── */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>

      {/* ── Tick marks on X ───────────────────────────────────────────── */}
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const t = -e + (i + 1) * (e * 2 / (TICK_COUNT + 1))
        return (
          <Line
            key={`xt${i}`}
            points={[[t, -0.12, 0], [t, 0.12, 0]]}
            color="#00d4ff"
            lineWidth={0.5}
            transparent opacity={0.3}
          />
        )
      })}

      {/* ── Tick marks on Y ───────────────────────────────────────────── */}
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const t = -e + (i + 1) * (e * 2 / (TICK_COUNT + 1))
        return (
          <Line
            key={`yt${i}`}
            points={[[-0.12, t, 0], [0.12, t, 0]]}
            color="#00ff88"
            lineWidth={0.5}
            transparent opacity={0.3}
          />
        )
      })}

      {/* ── Tick marks on Z ───────────────────────────────────────────── */}
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const t = -e + (i + 1) * (e * 2 / (TICK_COUNT + 1))
        return (
          <Line
            key={`zt${i}`}
            points={[[0, -0.12, t], [0, 0.12, t]]}
            color="#7b2fff"
            lineWidth={0.5}
            transparent opacity={0.3}
          />
        )
      })}

      {/* ── Grid plane (XZ) ───────────────────────────────────────────── */}
      <gridHelper
        args={[e * 2, 10, '#0a1d3a', '#071428']}
        position={[0, -e, 0]}
      />
    </group>
  )
}

function truncate(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
