/**
 * ThreatExplorer3D — SENTINEL 3D Behavioral Explorer
 *
 * Data sources
 * ────────────
 * RAW / KMEANS / DBSCAN  →  GET /api/explorer       (uniform 3 000-row sample)
 * ATTACK                  →  GET /api/explorer/attack (stratified: 800 BENIGN + attacks)
 *
 * Attack Type improvements
 * ─────────────────────────
 * • Dedicated stratified endpoint keeps rare attack labels visible
 * • Per-vertex alpha/size from attackRenderWeight() dims BENIGN, lifts attacks
 * • NormalBlending (inside PointCloud) stops color addition washing to white
 * • "Attacks Only" toggle filters out BENIGN entirely for focused review
 * • Legend shows per-label counts from the currently rendered point set
 */
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

import PointCloud   from './three/PointCloud'
import SceneAxes    from './three/SceneAxes'
import HoverTooltip from './three/HoverTooltip'

import {
  fetchExplorerPoints, fetchAttackPoints,
  KMEANS_COLORS, ATTACK_COLORS, DBSCAN_CORE_COLORS, DBSCAN_NOISE_COLOR,
  BENIGN_LABEL,
} from '../data/explorerApi'
import type { ExplorerPoint, VisualizationMode } from '../data/explorerApi'
import {
  FEATURES, FEATURE_MAP,
  DEFAULT_X, DEFAULT_Y, DEFAULT_Z,
  DEFAULT_COLOR_FEATURE, DEFAULT_SIZE_FEATURE,
} from '../data/cicids2017Features'

// ── Mode definitions ──────────────────────────────────────────────────────

const MODES: { id: VisualizationMode; label: string; desc: string }[] = [
  { id: 'RAW',    label: 'Raw Data',    desc: 'All points in uniform cyan'    },
  { id: 'KMEANS', label: 'K-Means',     desc: '5 clusters (k=5, seed=42)'     },
  { id: 'DBSCAN', label: 'DBSCAN',      desc: 'ε=3 · minPts=10 · noise=red'   },
  { id: 'ATTACK', label: 'Attack Type', desc: 'Colored by real CICIDS2017 label' },
]

// ── Sub-components ────────────────────────────────────────────────────────

function FeatureSelect({ label, value, onChange, color }: {
  label: string; value: string; onChange: (v: string) => void; color: string
}) {
  return (
    <div style={C.selectGroup}>
      <label style={{ ...C.selectLabel, color }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={C.select}>
        {FEATURES.map(f => (
          <option key={f.name} value={f.name}>{f.label}</option>
        ))}
      </select>
    </div>
  )
}

function ModeSelector({ mode, onChange }: {
  mode: VisualizationMode; onChange: (m: VisualizationMode) => void
}) {
  return (
    <div style={C.modeRow}>
      {MODES.map(m => (
        <button key={m.id} style={C.modePill(mode === m.id)}
          onClick={() => onChange(m.id)} title={m.desc}>
          {m.label}
        </button>
      ))}
    </div>
  )
}

/** Attacks-Only toggle — shown only in ATTACK mode */
function AttacksOnlyToggle({ value, onChange }: {
  value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={C.toggleWrap}>
      <button
        style={C.togglePill(!value)}
        onClick={() => onChange(false)}
        title="Show all traffic including BENIGN"
      >
        All Traffic
      </button>
      <button
        style={C.togglePill(value)}
        onClick={() => onChange(true)}
        title="Hide BENIGN — show attack flows only"
      >
        Attacks Only
      </button>
    </div>
  )
}

/**
 * Legend — ATTACK mode shows per-label counts from the rendered set.
 * Other modes show cluster/group colors only.
 */
function Legend({
  mode, renderedPoints, labelCounts, attacksOnly,
}: {
  mode:          VisualizationMode
  renderedPoints: ExplorerPoint[]
  labelCounts:   Record<string, number>
  attacksOnly:   boolean
}) {
  const entries = useMemo(() => {
    if (mode === 'RAW') {
      return [{ color: '#00d4ff', label: 'Network Flow', count: renderedPoints.length }]
    }

    if (mode === 'KMEANS') {
      const counts: Record<number, number> = {}
      renderedPoints.forEach(p => { counts[p.kmeans] = (counts[p.kmeans] ?? 0) + 1 })
      const seen = [...new Set(renderedPoints.map(p => p.kmeans))].sort((a, b) => a - b)
      return seen.map(k => ({
        color: KMEANS_COLORS[k] ?? '#fff',
        label: `Cluster ${k}`,
        count: counts[k] ?? 0,
      }))
    }

    if (mode === 'DBSCAN') {
      const counts: Record<number, number> = {}
      renderedPoints.forEach(p => { counts[p.dbscan] = (counts[p.dbscan] ?? 0) + 1 })
      const seen = [...new Set(renderedPoints.map(p => p.dbscan))].sort((a, b) => a - b)
      return seen.map(k => ({
        color: k === -1
          ? DBSCAN_NOISE_COLOR
          : (DBSCAN_CORE_COLORS[k % DBSCAN_CORE_COLORS.length] ?? '#fff'),
        label: k === -1 ? 'Noise' : `Cluster ${k}`,
        count: counts[k] ?? 0,
      }))
    }

    // ATTACK — use backend label_counts for the full fetched set; filter by attacksOnly
    const allLabels = Object.keys(ATTACK_COLORS)
    // Put BENIGN first, then alphabetical attacks
    const ordered = [
      BENIGN_LABEL,
      ...allLabels.filter(l => l !== BENIGN_LABEL).sort(),
    ]
    return ordered
      .filter(lbl => {
        if (attacksOnly && lbl === BENIGN_LABEL) return false
        return (labelCounts[lbl] ?? 0) > 0
      })
      .map(lbl => ({
        color: ATTACK_COLORS[lbl] ?? '#aaa',
        label: lbl,
        count: labelCounts[lbl] ?? 0,
      }))
  }, [mode, renderedPoints, labelCounts, attacksOnly])

  const showCounts = mode === 'ATTACK' || mode === 'KMEANS'

  return (
    <div style={C.legend}>
      {entries.map(e => (
        <div key={e.label} style={C.legendRow}>
          <span style={{
            ...C.legendDot,
            background: e.color,
            boxShadow: `0 0 ${mode === 'ATTACK' && e.label !== BENIGN_LABEL ? 5 : 3}px ${e.color}`,
          }} />
          <span style={C.legendLabel}>{e.label}</span>
          {showCounts && (
            <span style={C.legendCount}>{e.count.toLocaleString()}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function InfoPanel({ point, xF, yF, zF }: {
  point: ExplorerPoint; xF: string; yF: string; zF: string
}) {
  const kColor = KMEANS_COLORS[point.kmeans] ?? '#e8f4fd'
  const lColor = ATTACK_COLORS[point.label.trim()] ?? '#e8f4fd'
  const dColor = point.dbscan === -1
    ? DBSCAN_NOISE_COLOR
    : (DBSCAN_CORE_COLORS[point.dbscan % DBSCAN_CORE_COLORS.length] ?? '#e8f4fd')

  return (
    <motion.div style={C.infoPanel}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}   transition={{ duration: 0.2 }}>
      <div style={C.infoPanelTitle}>Selected Flow</div>
      <InfoRow k="Label"   v={point.label}    vc={lColor} />
      <InfoRow k="K-Means" v={`Cluster ${point.kmeans}`} vc={kColor} />
      <InfoRow k="DBSCAN"
        v={point.dbscan === -1 ? 'Noise' : `Cluster ${point.dbscan}`}
        vc={dColor} />
      <div style={C.infoDivider} />
      <InfoRow k={xF} v={fmtVal(point.features[xF])} vc="#00d4ff" trunc />
      <InfoRow k={yF} v={fmtVal(point.features[yF])} vc="#00ff88" trunc />
      <InfoRow k={zF} v={fmtVal(point.features[zF])} vc="#7b2fff" trunc />
    </motion.div>
  )
}

function InfoRow({ k, v, vc, trunc }: {
  k: string; v: string; vc: string; trunc?: boolean
}) {
  return (
    <div style={C.infoRow}>
      <span style={{
        ...C.infoKey,
        ...(trunc ? {
          maxWidth: '110px', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        } : {}),
      }}>{k}</span>
      <span style={{ ...C.infoVal, color: vc }}>{v}</span>
    </div>
  )
}

function fmtVal(v: number | undefined): string {
  if (v == null) return '—'
  if (v >= 1e6)  return (v / 1e6).toFixed(3) + ' M'
  if (v >= 1e3)  return (v / 1e3).toFixed(3) + ' K'
  return v.toFixed(3)
}

function LoadingOverlay() {
  return (
    <div style={{ ...S.canvasWrap, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#020b18' }}>
      <motion.div
        style={{ width: 48, height: 48, border: '2px solid rgba(0,212,255,0.15)',
          borderTop: '2px solid #00d4ff', borderRadius: '50%' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px',
        color: '#3a5570', letterSpacing: '0.1em' }}>
        LOADING REAL DATA…
      </span>
    </div>
  )
}

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ ...S.canvasWrap, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#020b18' }}>
      <span style={{ fontSize: '2rem' }}>⚠</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#ff3366',
        maxWidth: '360px', textAlign: 'center' }}>
        {message}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#3a5570',
        maxWidth: '400px', textAlign: 'center' }}>
        Start the backend:{' '}
        <code style={{ color: '#00d4ff' }}>uvicorn main:app --reload</code>
        {' '}(from the <code style={{ color: '#00d4ff' }}>backend/</code> folder)
      </span>
      <button onClick={onRetry} style={{ marginTop: '0.5rem', padding: '6px 18px',
        background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
        borderRadius: '6px', color: '#00d4ff', cursor: 'pointer',
        fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        Retry
      </button>
    </div>
  )
}

function Scene({ points, xFeature, yFeature, zFeature, sizeFeature,
  mode, hoveredId, selectedId, onHover, onSelect }: {
  points: ExplorerPoint[]
  xFeature: string; yFeature: string; zFeature: string; sizeFeature: string
  mode: VisualizationMode
  hoveredId: number | null; selectedId: number | null
  onHover: (id: number | null) => void; onSelect: (id: number | null) => void
}) {
  const hoveredPoint = hoveredId != null
    ? points.find(p => p.id === hoveredId) ?? null
    : null

  return (
    <>
      <Stars radius={30} depth={50} count={600} factor={2} fade speed={0.4} />
      <fog attach="fog" args={['#020b18', 18, 40]} />
      <SceneAxes
        xLabel={FEATURE_MAP[xFeature]?.label ?? xFeature}
        yLabel={FEATURE_MAP[yFeature]?.label ?? yFeature}
        zLabel={FEATURE_MAP[zFeature]?.label ?? zFeature}
      />
      <PointCloud
        points={points}
        xFeature={xFeature} yFeature={yFeature}
        zFeature={zFeature} sizeFeature={sizeFeature}
        mode={mode}
        hoveredId={hoveredId} selectedId={selectedId}
        onHover={onHover}    onSelect={onSelect}
      />
      {hoveredPoint && (
        <HoverTooltip
          point={hoveredPoint} allPoints={points}
          xFeature={xFeature} yFeature={yFeature} zFeature={zFeature}
        />
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.07}
        minDistance={3} maxDistance={30}
        panSpeed={0.6} rotateSpeed={0.55} zoomSpeed={0.8} />
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function ThreatExplorer3D() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [basePoints,   setBasePoints]   = useState<ExplorerPoint[]>([])
  const [attackPoints, setAttackPoints] = useState<ExplorerPoint[]>([])
  const [labelCounts,  setLabelCounts]  = useState<Record<string, number>>({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [mode,         setMode]         = useState<VisualizationMode>('KMEANS')
  const [attacksOnly,  setAttacksOnly]  = useState(false)
  const [xFeature,     setXFeature]     = useState(DEFAULT_X)
  const [yFeature,     setYFeature]     = useState(DEFAULT_Y)
  const [zFeature,     setZFeature]     = useState(DEFAULT_Z)
  const [colorFeature, setColorFeature] = useState(DEFAULT_COLOR_FEATURE)
  const [sizeFeature,  setSizeFeature]  = useState(DEFAULT_SIZE_FEATURE)
  const [hoveredId,    setHoveredId]    = useState<number | null>(null)
  const [selectedId,   setSelectedId]  = useState<number | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [showLegend,   setShowLegend]   = useState(true)

  void colorFeature  // reserved for future colour-by-feature mode

  // ── Load both datasets in parallel on mount ───────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [basePts, { points: atkPts, labelCounts: lc }] = await Promise.all([
        fetchExplorerPoints(),
        fetchAttackPoints(),
      ])
      setBasePoints(basePts)
      setAttackPoints(atkPts)
      setLabelCounts(lc)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Derive the active point set ───────────────────────────────────────
  const activePoints = useMemo((): ExplorerPoint[] => {
    if (mode !== 'ATTACK') return basePoints
    const pts = attacksOnly
      ? attackPoints.filter(p => p.label.trim() !== BENIGN_LABEL)
      : attackPoints
    return pts
  }, [mode, basePoints, attackPoints, attacksOnly])

  // Legend counts: for ATTACK use backend label_counts (full stratified set),
  // for other modes derive from currently rendered points
  const activeLabelCounts = useMemo((): Record<string, number> => {
    if (mode !== 'ATTACK') return {}
    if (attacksOnly) {
      // Exclude BENIGN from the counts
      return Object.fromEntries(
        Object.entries(labelCounts).filter(([k]) => k !== BENIGN_LABEL)
      )
    }
    return labelCounts
  }, [mode, labelCounts, attacksOnly])

  const selectedPoint = useMemo(
    () => selectedId != null ? activePoints.find(p => p.id === selectedId) ?? null : null,
    [selectedId, activePoints]
  )

  const handleHover  = useCallback((id: number | null) => setHoveredId(id),  [])
  const handleSelect = useCallback((id: number | null) => setSelectedId(id), [])

  const handleModeChange = useCallback((m: VisualizationMode) => {
    setMode(m)
    setSelectedId(null)
    setHoveredId(null)
    if (m !== 'ATTACK') setAttacksOnly(false)
  }, [])

  // ── Counts for status bar ────────────────────────────────────────────
  const renderedCount = activePoints.length
  const totalFetched  = mode === 'ATTACK' ? attackPoints.length : basePoints.length

  return (
    <div style={S.root}>
      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div style={S.statusBar}>
        {loading ? (
          <span style={{ color: '#3a5570' }}>⟳ Fetching data from backend…</span>
        ) : error ? (
          <span style={{ color: '#ff3366' }}>
            ✗ Backend unavailable — start with{' '}
            <code>uvicorn main:app --reload</code>
          </span>
        ) : (
          <>
            <span className="pulse-dot" style={{ display: 'inline-block' }} />
            <span style={{ color: '#00ff88' }}>
              LIVE — {renderedCount.toLocaleString()} flows rendered
              {renderedCount !== totalFetched && ` (${totalFetched.toLocaleString()} fetched)`}
              {' · '}real CICIDS2017 data
            </span>
          </>
        )}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div style={S.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <ModeSelector mode={mode} onChange={handleModeChange} />
            {/* Attacks-Only toggle — visible only in Attack Type mode */}
            {mode === 'ATTACK' && (
              <AttacksOnlyToggle value={attacksOnly} onChange={v => {
                setAttacksOnly(v)
                setSelectedId(null)
              }} />
            )}
          </div>
          <div style={S.toolbarRight}>
            <span style={S.pointCount}>{renderedCount.toLocaleString()} pts</span>
            <button style={S.iconBtn} onClick={() => setShowLegend(v => !v)}
              title="Toggle legend">🗂</button>
            <button style={S.iconBtn} onClick={() => setShowControls(v => !v)}
              title="Toggle controls">⚙</button>
          </div>
        </div>
      )}

      {/* ── Canvas / Loading / Error ───────────────────────────────────── */}
      {loading ? (
        <LoadingOverlay />
      ) : error ? (
        <ErrorOverlay message={error} onRetry={loadData} />
      ) : (
        <div style={S.canvasWrap}>
          <Canvas
            camera={{ position: [8, 5, 12], fov: 55 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#020b18' }}
            dpr={[1, 1.5]}
          >
            <Suspense fallback={null}>
              <Scene
                points={activePoints}
                xFeature={xFeature} yFeature={yFeature}
                zFeature={zFeature} sizeFeature={sizeFeature}
                mode={mode}
                hoveredId={hoveredId} selectedId={selectedId}
                onHover={handleHover}  onSelect={handleSelect}
              />
            </Suspense>
          </Canvas>

          {/* Legend overlay */}
          <AnimatePresence>
            {showLegend && (
              <motion.div style={S.legendOverlay}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}   transition={{ duration: 0.2 }}>
                <div style={C.legendTitle}>
                  {MODES.find(m => m.id === mode)?.label}
                  {mode === 'ATTACK' && attacksOnly && (
                    <span style={{ color: '#ff3366', marginLeft: '6px' }}>· Attacks Only</span>
                  )}
                </div>
                <Legend
                  mode={mode}
                  renderedPoints={activePoints}
                  labelCounts={activeLabelCounts}
                  attacksOnly={attacksOnly}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info panel */}
          <AnimatePresence>
            {selectedPoint && (
              <div style={S.infoOverlay}>
                <InfoPanel
                  point={selectedPoint}
                  xF={xFeature} yF={yFeature} zF={zFeature}
                />
                <button style={S.closeBtn} onClick={() => setSelectedId(null)}
                  title="Deselect">✕</button>
              </div>
            )}
          </AnimatePresence>

          {/* Hint */}
          {!hoveredId && !selectedId && (
            <div style={S.hint}>
              Drag to rotate · Scroll to zoom · Click a point to inspect
            </div>
          )}
        </div>
      )}

      {/* ── Controls panel ────────────────────────────────────────────── */}
      {!loading && !error && (
        <AnimatePresence>
          {showControls && (
            <motion.div style={S.controlPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}>
              <div style={C.grid}>
                <FeatureSelect label="X Axis"     value={xFeature}     onChange={setXFeature}     color="#00d4ff" />
                <FeatureSelect label="Y Axis"     value={yFeature}     onChange={setYFeature}     color="#00ff88" />
                <FeatureSelect label="Z Axis"     value={zFeature}     onChange={setZFeature}     color="#7b2fff" />
                <FeatureSelect label="Point Size" value={sizeFeature}  onChange={setSizeFeature}  color="#ff9500" />
                <FeatureSelect label="Color Dim"  value={colorFeature} onChange={setColorFeature} color="#ec4899" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// ── Layout styles ─────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root: {
    width: '100%', background: '#050f1f',
    border: '1px solid rgba(0,212,255,0.12)', borderRadius: '16px',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  statusBar: {
    background: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(0,255,136,0.12)',
    padding: '6px 16px', fontSize: '11px', fontFamily: 'var(--font-mono)',
    letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px', borderBottom: '1px solid rgba(0,212,255,0.08)',
    flexWrap: 'wrap', gap: '8px',
  },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  pointCount: {
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    color: '#3a5570', letterSpacing: '0.06em',
  },
  iconBtn: {
    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)',
    borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
    fontSize: '14px', color: '#e8f4fd', transition: 'background 0.15s',
  },
  canvasWrap: { position: 'relative', width: '100%', height: '520px' },
  legendOverlay: {
    position: 'absolute', top: '12px', left: '12px',
    background: 'rgba(2,11,24,0.92)', border: '1px solid rgba(0,212,255,0.18)',
    borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(8px)',
    maxHeight: '480px', overflowY: 'auto',
  },
  infoOverlay: {
    position: 'absolute', top: '12px', right: '12px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  closeBtn: {
    background: 'rgba(255,51,102,0.12)', border: '1px solid rgba(255,51,102,0.3)',
    borderRadius: '6px', color: '#ff3366', cursor: 'pointer',
    padding: '4px 10px', fontSize: '12px', fontFamily: 'var(--font-mono)',
    alignSelf: 'flex-end',
  },
  hint: {
    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
    fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3a5570',
    pointerEvents: 'none', whiteSpace: 'nowrap',
  },
  controlPanel: {
    borderTop: '1px solid rgba(0,212,255,0.08)',
    overflow: 'hidden', padding: '12px 16px',
  },
}

// ── Control / UI element styles ───────────────────────────────────────────

const C: {
  modeRow:        React.CSSProperties
  modePill:       (active: boolean) => React.CSSProperties
  toggleWrap:     React.CSSProperties
  togglePill:     (active: boolean) => React.CSSProperties
  grid:           React.CSSProperties
  selectGroup:    React.CSSProperties
  selectLabel:    React.CSSProperties
  select:         React.CSSProperties
  legend:         React.CSSProperties
  legendTitle:    React.CSSProperties
  legendRow:      React.CSSProperties
  legendDot:      React.CSSProperties
  legendLabel:    React.CSSProperties
  legendCount:    React.CSSProperties
  infoPanel:      React.CSSProperties
  infoPanelTitle: React.CSSProperties
  infoRow:        React.CSSProperties
  infoKey:        React.CSSProperties
  infoVal:        React.CSSProperties
  infoDivider:    React.CSSProperties
} = {
  modeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  modePill: (active) => ({
    padding: '5px 14px', borderRadius: '999px',
    border:  `1px solid ${active ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.15)'}`,
    background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
    color: active ? '#00d4ff' : '#7a9ab8',
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    fontWeight: active ? 700 : 400, cursor: 'pointer',
    transition: 'all 0.15s', letterSpacing: '0.04em',
  }),
  // Attacks-only toggle — amber accent to distinguish from mode pills
  toggleWrap: {
    display: 'flex', gap: '2px',
    background: 'rgba(255,149,0,0.06)',
    border: '1px solid rgba(255,149,0,0.2)',
    borderRadius: '999px', padding: '2px',
  },
  togglePill: (active) => ({
    padding: '3px 12px', borderRadius: '999px',
    background: active ? 'rgba(255,149,0,0.22)' : 'transparent',
    color: active ? '#ffab00' : '#7a9ab8',
    border: 'none', fontFamily: 'var(--font-mono)', fontSize: '10px',
    fontWeight: active ? 700 : 400, cursor: 'pointer',
    transition: 'all 0.15s', letterSpacing: '0.04em',
  }),
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' },
  selectGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  selectLabel: { fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  select:      { background: '#050f1f', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '6px', color: '#e8f4fd', padding: '5px 8px', fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none', width: '100%' },
  legend:      { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' },
  legendTitle: { fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3a5570', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' },
  legendRow:   { display: 'flex', alignItems: 'center', gap: '7px' },
  legendDot:   { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#7a9ab8', whiteSpace: 'nowrap', flex: 1 },
  legendCount: { fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3a5570', textAlign: 'right', minWidth: '32px' },
  infoPanel:      { background: 'rgba(2,11,24,0.93)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: '10px', padding: '12px 14px', minWidth: '200px', backdropFilter: 'blur(8px)' },
  infoPanelTitle: { fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3a5570', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' },
  infoRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '2px 0' },
  infoKey:     { fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#3a5570' },
  infoVal:     { fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 },
  infoDivider: { height: '1px', background: 'rgba(0,212,255,0.1)', margin: '6px 0' },
}
