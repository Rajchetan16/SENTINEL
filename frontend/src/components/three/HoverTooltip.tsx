/**
 * HoverTooltip — HTML overlay rendered via Drei's <Html> component.
 * Appears at the hovered point's world position, follows camera projection.
 */
import { Html } from '@react-three/drei'
import type { ExplorerPoint } from '../../data/explorerApi'
import { featureExtent, normalizeToScene, ATTACK_COLORS, KMEANS_COLORS,
         DBSCAN_NOISE_COLOR, DBSCAN_CORE_COLORS } from '../../data/explorerApi'

interface HoverTooltipProps {
  point:     ExplorerPoint
  allPoints: ExplorerPoint[]
  xFeature:  string
  yFeature:  string
  zFeature:  string
}

export default function HoverTooltip({
  point, allPoints, xFeature, yFeature, zFeature,
}: HoverTooltipProps) {
  const xE = featureExtent(allPoints, xFeature)
  const yE = featureExtent(allPoints, yFeature)
  const zE = featureExtent(allPoints, zFeature)

  const x = normalizeToScene(point.features[xFeature] ?? 0, ...xE)
  const y = normalizeToScene(point.features[yFeature] ?? 0, ...yE)
  const z = normalizeToScene(point.features[zFeature] ?? 0, ...zE)

  const labelColor  = ATTACK_COLORS[point.label] ?? '#e8f4fd'
  const kmeansColor = KMEANS_COLORS[point.kmeans] ?? '#e8f4fd'
  const dbscanColor = point.dbscan === -1
    ? DBSCAN_NOISE_COLOR
    : (DBSCAN_CORE_COLORS[point.dbscan % DBSCAN_CORE_COLORS.length] ?? '#e8f4fd')

  return (
    <Html
      position={[x, y + 0.4, z]}
      center
      distanceFactor={14}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div style={styles.tooltip}>
        <div style={{ ...styles.labelRow, color: labelColor }}>{point.label}</div>
        <div style={styles.divider} />
        <Row name="K-Means" value={`Cluster ${point.kmeans}`} color={kmeansColor} />
        <Row name="DBSCAN"
             value={point.dbscan === -1 ? 'Noise (-1)' : `Cluster ${point.dbscan}`}
             color={dbscanColor} />
        <div style={styles.divider} />
        <Row name={shortName(xFeature)} value={fmt(point.features[xFeature])} color="#00d4ff" />
        <Row name={shortName(yFeature)} value={fmt(point.features[yFeature])} color="#00ff88" />
        <Row name={shortName(zFeature)} value={fmt(point.features[zFeature])} color="#7b2fff" />
      </div>
    </Html>
  )
}

function Row({ name, value, color = '#7a9ab8' }: { name: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', lineHeight: 1.6 }}>
      <span style={{ color: '#7a9ab8', fontSize: '10px' }}>{name}</span>
      <span style={{ color, fontSize: '10px', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function fmt(v: number | undefined): string {
  if (v == null) return '—'
  if (v >= 1e6)  return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3)  return (v / 1e3).toFixed(2) + 'K'
  return v.toFixed(2)
}

function shortName(s: string): string {
  return s.length > 14 ? s.slice(0, 13) + '…' : s
}

const styles: Record<string, React.CSSProperties> = {
  tooltip: {
    background:     'rgba(2,11,24,0.93)',
    border:         '1px solid rgba(0,212,255,0.35)',
    borderRadius:   '8px',
    padding:        '8px 10px',
    minWidth:       '164px',
    fontFamily:     "'Consolas','Fira Code',monospace",
    boxShadow:      '0 0 16px rgba(0,212,255,0.2)',
    backdropFilter: 'blur(8px)',
    whiteSpace:     'nowrap',
  },
  labelRow: {
    fontSize:     '11px',
    fontWeight:   700,
    letterSpacing:'0.08em',
    marginBottom: '4px',
  },
  divider: {
    height:     '1px',
    background: 'rgba(0,212,255,0.15)',
    margin:     '4px 0',
  },
}
