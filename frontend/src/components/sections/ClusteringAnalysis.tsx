/**
 * ClusteringAnalysis — SENTINEL Clustering Results Section
 *
 * Displays verified K-Means and DBSCAN results from the CICIDS2017 50k sample.
 * All numbers are hard-coded from the confirmed mining.py output — no invented stats.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'
import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'

// ── Verified mining results ───────────────────────────────────────────────

const KMEANS_RESULTS = {
  sampleSize:      50_000,
  nClusters:       5,
  inertia:         2_153_115.52,
  silhouette:      0.4326,
  clusters: [
    { id: 0, size: 41_938, color: '#00d4ff', interpretation: 'Benign baseline traffic — high-volume normal flows' },
    { id: 1, size:  2_831, color: '#0066ff', interpretation: 'Moderate-rate flows — mixed service traffic'        },
    { id: 2, size:      2, color: '#7b2fff', interpretation: 'Extreme outlier pair — highly anomalous features'   },
    { id: 3, size:    509, color: '#00ff88', interpretation: 'Low-volume bursts — potential scan / probe activity' },
    { id: 4, size:  4_720, color: '#ff6b35', interpretation: 'High-intensity flows — attack-pattern characteristics' },
  ],
}

const DBSCAN_RESULTS = {
  sampleSize:      50_000,
  eps:             3,
  minSamples:      10,
  clustersFound:   47,
  noisePoints:     1_197,
  noisePct:        2.39,
  // Top clusters by size (from actual DBSCAN output)
  topClusters: [
    { id:  0, size: 37_485 },
    { id:  1, size:  4_687 },
    { id:  4, size:  1_864 },
    { id:  2, size:  1_833 },
    { id:  6, size:    521 },
    { id: 11, size:    280 },
    { id:  7, size:    833 },
    { id:  8, size:    102 },
    { id:  9, size:     97 },
    { id: 10, size:     71 },
  ],
}

// ── Colour helpers ────────────────────────────────────────────────────────

const KMEANS_COLORS = KMEANS_RESULTS.clusters.map(c => c.color)

function dbscanColor(id: number): string {
  const hue = Math.round((id * 360) / 47)
  return `hsl(${hue},75%,58%)`
}

// ── Custom Recharts tooltip ───────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={styles.tooltipRow}>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{p.name}</span>
          <span style={{ color: '#00d4ff', fontWeight: 600 }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Silhouette quality badge ──────────────────────────────────────────────

function SilhouetteMeter({ score }: { score: number }) {
  const pct = score * 100       // 0.4326 → 43.26 %
  const quality = score >= 0.5 ? 'Strong'
    : score >= 0.25 ? 'Reasonable'
    : 'Weak'
  const barColor = score >= 0.5 ? '#00ff88' : score >= 0.25 ? '#ff9500' : '#ff3366'

  return (
    <div style={styles.silhouetteWrap}>
      <div style={styles.silhouetteHeader}>
        <span style={styles.silhouetteLabel}>Silhouette Score</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: barColor, fontWeight: 700 }}>
          {score.toFixed(4)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: barColor,
          background: `${barColor}18`, border: `1px solid ${barColor}40`,
          borderRadius: '4px', padding: '2px 8px' }}>
          {quality}
        </span>
      </div>
      <div style={styles.silhouetteTrack}>
        <motion.div
          style={{ ...styles.silhouetteFill, background: barColor, boxShadow: `0 0 8px ${barColor}80` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        />
        {/* Reference lines at 0.25 and 0.5 */}
        <div style={{ ...styles.silhouetteRef, left: '25%' }} title="Weak/Reasonable boundary (0.25)" />
        <div style={{ ...styles.silhouetteRef, left: '50%' }} title="Reasonable/Strong boundary (0.50)" />
      </div>
      <div style={styles.silhouetteScale}>
        <span>0.0 — Random</span>
        <span>0.25</span>
        <span>0.5</span>
        <span>0.75</span>
        <span>1.0 — Perfect</span>
      </div>
    </div>
  )
}

// ── DBSCAN cluster-size bar chart ─────────────────────────────────────────

function DbscanTopClusters() {
  const data = useMemo(() =>
    DBSCAN_RESULTS.topClusters.map(c => ({
      name:  `C${c.id}`,
      size:  c.size,
      color: dbscanColor(c.id),
    })),
  [])

  return (
    <div style={styles.chartBox}>
      <div style={styles.chartTitle}>Top 10 Clusters by Size</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name" tick={{ fill: '#3a5570', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#3a5570', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false} width={52}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
          <Bar dataKey="size" name="Flows" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Noise vs Clustered donut ──────────────────────────────────────────────

function DbscanNoisePie() {
  const data = [
    { name: 'Clustered',  value: DBSCAN_RESULTS.sampleSize - DBSCAN_RESULTS.noisePoints, fill: '#00d4ff' },
    { name: 'Noise (−1)', value: DBSCAN_RESULTS.noisePoints, fill: '#ff3366' },
  ]

  return (
    <div style={styles.chartBox}>
      <div style={styles.chartTitle}>Clustered vs Noise</div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name"
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={68}
            paddingAngle={3}
            startAngle={90} endAngle={-270}
          >
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
          <Legend
            iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#7a9ab8' }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── K-Means cluster bar chart ─────────────────────────────────────────────

function KMeansBarChart() {
  const data = KMEANS_RESULTS.clusters.map(c => ({
    name:  `C${c.id}`,
    size:  c.size,
    color: c.color,
  }))

  return (
    <div style={styles.chartBox}>
      <div style={styles.chartTitle}>Cluster Sizes (50 000-row sample)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name"
            tick={{ fill: '#3a5570', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#3a5570', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false} width={52}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
          <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
          <Bar dataKey="size" name="Flows" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────

export default function ClusteringAnalysis() {
  return (
    <SectionWrapper id="clustering" style={{ background: 'rgba(7,20,40,0.4)' }}>
      <div className="container">

        <SectionHeader
          label="Clustering Analysis"
          title="K-Means &amp; DBSCAN"
          titleAccent="Verified Results"
          description="Two complementary unsupervised algorithms applied to a standardized 50,000-row sample from CICIDS2017. K-Means imposes spherical partitions; DBSCAN discovers arbitrary-shaped dense regions and isolates anomalous flows as noise."
        />

        {/* ── K-Means block ─────────────────────────────────────────────── */}
        <motion.div
          style={styles.block}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div style={styles.blockHeader}>
            <span className="badge badge-cyan">K-Means</span>
            <h3 style={{ fontSize: '1.1rem' }}>Partition-Based · k = 5 · random_state = 42</h3>
          </div>

          <p style={styles.desc}>
            The 50,000-flow sample was standardized with{' '}
            <code>StandardScaler</code> and partitioned into{' '}
            <code>n_clusters=5</code> spherical clusters by minimizing within-cluster
            sum of squares. Cluster 0 dominates (83.9 %) reflecting the heavy{' '}
            <em>BENIGN</em> majority in CICIDS2017. Clusters 1 and 4 capture attack-like
            traffic at higher packet rates. Cluster 2 contains only 2 points — extreme
            outliers pushed to their own centroid.
          </p>

          {/* Key metrics */}
          <div style={styles.statsRow}>
            <StatCard value="50K"          label="Sample Size"       accent="var(--accent-cyan)"   />
            <StatCard value="5"            label="Clusters"          accent="var(--accent-cyan)"   />
            <StatCard value="2,153,115"    label="Inertia (WCSS)"    accent="var(--accent-blue)"   />
            <StatCard value="0.4326"       label="Silhouette Score"  accent="var(--accent-green)"  />
          </div>

          {/* Silhouette meter */}
          <SilhouetteMeter score={KMEANS_RESULTS.silhouette} />

          {/* Bar chart + cluster legend side by side */}
          <div style={styles.twoCol}>
            <KMeansBarChart />
            <div style={styles.clusterList}>
              {KMEANS_RESULTS.clusters.map((c, i) => (
                <motion.div
                  key={c.id}
                  style={styles.clusterRow}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{ ...styles.dot, background: c.color, boxShadow: `0 0 7px ${c.color}` }} />
                    <span style={styles.clusterIdLabel}>Cluster {c.id}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.clusterSizeBar}>
                      <motion.div
                        style={{
                          ...styles.clusterSizeFill,
                          background: c.color,
                          opacity: 0.7,
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(c.size / KMEANS_RESULTS.clusters[0].size) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                    <div style={styles.clusterMeta}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {c.size.toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {((c.size / KMEANS_RESULTS.sampleSize) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.clusterInterp}>{c.interpretation}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <ResultNote color="var(--accent-cyan)" path="data/processed/results/kmeans_results.csv" />
        </motion.div>

        {/* ── DBSCAN block ───────────────────────────────────────────────── */}
        <motion.div
          style={{ ...styles.block, borderColor: 'rgba(123,47,255,0.2)' }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Header */}
          <div style={styles.blockHeader}>
            <span className="badge badge-purple">DBSCAN</span>
            <h3 style={{ fontSize: '1.1rem' }}>Density-Based · ε = 3 · minPts = 10</h3>
          </div>

          <p style={styles.desc}>
            <code>DBSCAN(eps=3, min_samples=10)</code> on the same standardized sample
            discovered <strong style={{ color: 'var(--text-primary)' }}>47 variable-shape clusters</strong>{' '}
            without requiring a pre-set k. Cluster 0 absorbs 74.97 % of points (dense
            benign traffic). The remaining 46 clusters isolate minority attack types by
            their local density. The{' '}
            <strong style={{ color: '#ff3366' }}>1,197 noise points (2.39 %)</strong>{' '}
            are low-density flows that belong to no cluster — these correspond predominantly
            to rare attacks such as Heartbleed, SQL Injection, and Infiltration.
          </p>

          {/* Key metrics */}
          <div style={styles.statsRow}>
            <StatCard value="50K"   label="Sample Size"          accent="var(--accent-purple)" />
            <StatCard value="47"    label="Clusters Found"       accent="var(--accent-purple)" />
            <StatCard value="1,197" label="Noise Points"         accent="var(--accent-red)"    />
            <StatCard value="2.39%" label="Noise %"              accent="var(--accent-red)"    />
          </div>

          {/* Noise visual callout */}
          <div style={styles.noiseCallout}>
            <div style={styles.noiseCalloutLeft}>
              <span style={{ fontSize: '1.8rem' }}>🔴</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ff3366', fontWeight: 700 }}>
                  1,197 Noise Points Detected
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Flows assigned label <code>−1</code> — outside all dense regions.
                  These represent statistically anomalous traffic that cannot be grouped
                  by local density alone.
                </div>
              </div>
            </div>
            <div style={styles.noiseStat}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700, color: '#ff3366' }}>
                {DBSCAN_RESULTS.noisePct}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                of sample
              </span>
            </div>
          </div>

          {/* Charts */}
          <div style={styles.twoCol}>
            <DbscanTopClusters />
            <DbscanNoisePie />
          </div>

          {/* Cluster count breakdown */}
          <div style={styles.dbscanSummaryGrid}>
            <DbscanStat label="Total clusters (excl. noise)" value="47"     color="var(--accent-purple)" />
            <DbscanStat label="Largest cluster (C0)"         value="37,485" color="var(--accent-cyan)"   />
            <DbscanStat label="Smallest clusters"            value="≥ 10"   color="var(--text-secondary)"/>
            <DbscanStat label="Noise points"                 value="1,197"  color="var(--accent-red)"    />
          </div>

          <ResultNote color="var(--accent-purple)" path="data/processed/results/dbscan_results.csv" />
        </motion.div>

        {/* ── Comparison callout ─────────────────────────────────────────── */}
        <motion.div
          style={styles.compareBox}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div style={styles.compareTitle}>Algorithm Comparison</div>
          <div style={styles.compareGrid}>
            <CompareRow aspect="Approach"    km="Partition (centroid)"      db="Density-connected regions" />
            <CompareRow aspect="k required"  km="Yes — k = 5"               db="No — discovered automatically" />
            <CompareRow aspect="Cluster shape" km="Spherical (Voronoi)"     db="Arbitrary shape" />
            <CompareRow aspect="Outliers"    km="Absorbed into nearest cluster" db="Labelled noise (−1)" />
            <CompareRow aspect="Result"      km="5 partitions"              db="47 clusters + 1,197 noise" />
            <CompareRow aspect="Silhouette"  km="0.4326 (Reasonable)"       db="N/A (noise complicates scoring)" />
          </div>
        </motion.div>

      </div>
    </SectionWrapper>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────

function ResultNote({ color, path }: { color: string; path: string }) {
  return (
    <div style={{ ...styles.resultNote, borderColor: `${color}20` }}>
      <span>📄</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        Full results → <code style={{ color }}>{path}</code>
      </span>
    </div>
  )
}

function DbscanStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={styles.dbscanStatCard}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{label}</span>
    </div>
  )
}

function CompareRow({ aspect, km, db }: { aspect: string; km: string; db: string }) {
  return (
    <div style={styles.compareRow}>
      <span style={styles.compareAspect}>{aspect}</span>
      <span style={styles.compareKm}>{km}</span>
      <span style={styles.compareDb}>{db}</span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  block: {
    background:   'var(--bg-card)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '14px',
    padding:      '2rem',
    marginBottom: '1.5rem',
  },
  blockHeader: {
    display:     'flex',
    alignItems:  'center',
    gap:         '0.75rem',
    marginBottom:'1rem',
    flexWrap:    'wrap',
  },
  desc: {
    fontSize:     '0.875rem',
    color:        'var(--text-secondary)',
    lineHeight:   1.75,
    marginBottom: '1.5rem',
    maxWidth:     '800px',
  },
  statsRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap:                 '0.75rem',
    marginBottom:        '1.5rem',
  },
  // Silhouette meter
  silhouetteWrap: {
    marginBottom: '1.5rem',
    padding:      '1rem 1.25rem',
    background:   'rgba(0,212,255,0.03)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  silhouetteHeader: {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.75rem',
    marginBottom:   '0.6rem',
    flexWrap:       'wrap',
  },
  silhouetteLabel: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.72rem',
    color:         'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    flex:          1,
  },
  silhouetteTrack: {
    position:     'relative',
    height:       '8px',
    background:   'rgba(255,255,255,0.06)',
    borderRadius: '4px',
    overflow:     'visible',
    marginBottom: '0.4rem',
  },
  silhouetteFill: {
    height:       '100%',
    borderRadius: '4px',
    position:     'absolute',
    top:          0,
    left:         0,
  },
  silhouetteRef: {
    position:   'absolute',
    top:        '-3px',
    width:      '1px',
    height:     '14px',
    background: 'rgba(255,255,255,0.2)',
  },
  silhouetteScale: {
    display:        'flex',
    justifyContent: 'space-between',
    fontFamily:     'var(--font-mono)',
    fontSize:       '0.63rem',
    color:          'var(--text-muted)',
    marginTop:      '0.25rem',
  },
  // Two-col layout for chart + legend
  twoCol: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap:                 '1rem',
    marginBottom:        '1.25rem',
  },
  chartBox: {
    background:   'rgba(0,0,0,0.2)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding:      '1rem 0.75rem 0.5rem',
  },
  chartTitle: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.7rem',
    color:         'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom:  '0.5rem',
    paddingLeft:   '0.25rem',
  },
  // Cluster list (K-Means)
  clusterList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.6rem',
    justifyContent:'center',
  },
  clusterRow: {
    display:    'flex',
    gap:        '0.75rem',
    alignItems: 'flex-start',
  },
  dot: {
    width:        '9px',
    height:       '9px',
    borderRadius: '50%',
    flexShrink:   0,
    marginTop:    '3px',
  },
  clusterIdLabel: {
    fontFamily:  'var(--font-mono)',
    fontSize:    '0.75rem',
    color:       'var(--text-secondary)',
    whiteSpace:  'nowrap',
  },
  clusterSizeBar: {
    height:       '4px',
    background:   'rgba(255,255,255,0.06)',
    borderRadius: '2px',
    overflow:     'hidden',
    marginBottom: '3px',
  },
  clusterSizeFill: {
    height:       '100%',
    borderRadius: '2px',
  },
  clusterMeta: {
    display:        'flex',
    justifyContent: 'space-between',
    fontFamily:     'var(--font-mono)',
    fontSize:       '0.72rem',
    marginBottom:   '2px',
  },
  clusterInterp: {
    fontSize:  '0.72rem',
    color:     'var(--text-muted)',
    lineHeight: 1.5,
  },
  // DBSCAN noise callout
  noiseCallout: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    gap:             '1rem',
    padding:         '1rem 1.25rem',
    background:      'rgba(255,51,102,0.05)',
    border:          '1px solid rgba(255,51,102,0.2)',
    borderRadius:    '8px',
    marginBottom:    '1.25rem',
    flexWrap:        'wrap',
  },
  noiseCalloutLeft: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '0.75rem',
    flex:       1,
  },
  noiseStat: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'flex-end',
    flexShrink:     0,
  },
  dbscanSummaryGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap:                 '0.6rem',
    marginBottom:        '1.25rem',
  },
  dbscanStatCard: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    padding:        '0.75rem',
    background:     'rgba(123,47,255,0.05)',
    border:         '1px solid rgba(123,47,255,0.15)',
    borderRadius:   '8px',
    textAlign:      'center',
  },
  resultNote: {
    display:      'flex',
    alignItems:   'center',
    gap:          '0.5rem',
    marginTop:    '1.25rem',
    padding:      '0.6rem 1rem',
    background:   'rgba(0,212,255,0.03)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '6px',
  },
  // Comparison table
  compareBox: {
    background:   'var(--bg-card)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding:      '1.5rem 2rem',
    marginBottom: '1.5rem',
  },
  compareTitle: {
    fontFamily:    'var(--font-mono)',
    fontSize:      '0.7rem',
    color:         'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom:  '1rem',
  },
  compareGrid: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0px',
  },
  compareRow: {
    display:             'grid',
    gridTemplateColumns: '160px 1fr 1fr',
    gap:                 '1rem',
    padding:             '0.55rem 0',
    borderBottom:        '1px solid var(--border-subtle)',
    alignItems:          'start',
  },
  compareAspect: {
    fontFamily:  'var(--font-mono)',
    fontSize:    '0.75rem',
    color:       'var(--text-muted)',
    fontWeight:  600,
  },
  compareKm: {
    fontSize:   '0.82rem',
    color:      'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
  },
  compareDb: {
    fontSize:   '0.82rem',
    color:      'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
  },
  tooltip: {
    background:   'rgba(2,11,24,0.95)',
    border:       '1px solid rgba(0,212,255,0.25)',
    borderRadius: '7px',
    padding:      '8px 12px',
    fontFamily:   'monospace',
    fontSize:     '11px',
    boxShadow:    '0 0 12px rgba(0,212,255,0.15)',
  },
  tooltipLabel: {
    color:        'var(--accent-cyan)',
    fontWeight:   700,
    marginBottom: '4px',
    letterSpacing:'0.05em',
  },
  tooltipRow: {
    display:        'flex',
    justifyContent: 'space-between',
    gap:            '12px',
  },
}
