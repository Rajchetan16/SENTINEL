/**
 * explorerApi.ts — typed fetch layer for the SENTINEL FastAPI backend.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExplorerPoint {
  id:       number
  features: Record<string, number>
  kmeans:   number
  dbscan:   number
  label:    string
  isNoise:  boolean
}

export type VisualizationMode = 'RAW' | 'KMEANS' | 'DBSCAN' | 'ATTACK'

interface ApiResponse {
  count:        number
  features:     string[]
  points:       Record<string, number | string>[]
  label_counts?: Record<string, number>   // only present on /attack endpoint
}

// ── Constants ──────────────────────────────────────────────────────────────

export const BENIGN_LABEL = 'BENIGN'

// ── Colour maps ────────────────────────────────────────────────────────────

export const KMEANS_COLORS: Record<number, string> = {
  0: '#00d4ff',
  1: '#0066ff',
  2: '#7b2fff',
  3: '#00ff88',
  4: '#ff6b35',
}

/**
 * Attack Type colour map.
 *
 * BENIGN is intentionally muted — it acts as background context.
 * All attack categories use high-saturation, visually distinct hues so
 * they stand out immediately against the dim green BENIGN cloud.
 *
 * Labels are the exact strings produced by preprocess.py (whitespace-trimmed,
 * "?" replaced with "-").
 */
export const ATTACK_COLORS: Record<string, string> = {
  // Background context — muted, low-saturation green
  BENIGN:                         '#1a5c2e',

  // Volumetric DoS / DDoS attacks — warm reds/oranges
  DDoS:                           '#ff1744',
  'DoS Hulk':                     '#ff6d00',
  'DoS GoldenEye':                '#ffab00',
  'DoS slowloris':                '#ff6e40',
  'DoS Slowhttptest':             '#ffd740',

  // Credential attacks — purples/violets
  'FTP-Patator':                  '#d500f9',
  'SSH-Patator':                  '#aa00ff',

  // Network reconnaissance
  PortScan:                       '#2979ff',

  // Botnet
  Bot:                            '#651fff',

  // Web attacks — pinks/magentas
  'Web Attack - Brute Force':     '#f50057',
  'Web Attack - XSS':             '#e040fb',
  'Web Attack - Sql Injection':   '#ff4081',

  // Rare / exotic — stand-out colours
  Infiltration:                   '#00e5ff',
  Heartbleed:                     '#ffffff',
}

export const DBSCAN_NOISE_COLOR = '#ff3366'

// 47 distinct colours cycling through the hue wheel for DBSCAN clusters 0–46
export const DBSCAN_CORE_COLORS: string[] = Array.from({ length: 47 }, (_, i) => {
  const hue = Math.round((i * 360) / 47)
  return `hsl(${hue},80%,60%)`
})

// ── Per-point rendering weights for Attack Type mode ──────────────────────

/**
 * Returns { sizeMult, alphaMult } for a given label in Attack Type mode.
 *
 * BENIGN:  small + very transparent  → background context
 * Attack:  normal/larger + opaque    → clearly visible foreground
 */
export function attackRenderWeight(label: string): { sizeMult: number; alphaMult: number } {
  if (label.trim() === BENIGN_LABEL) {
    return { sizeMult: 0.55, alphaMult: 0.18 }
  }
  return { sizeMult: 1.25, alphaMult: 1.0 }
}

// ── Normalisation helpers ──────────────────────────────────────────────────

export function featureExtent(
  points: ExplorerPoint[],
  featureName: string
): [number, number] {
  let min = Infinity, max = -Infinity
  for (const p of points) {
    const v = p.features[featureName] ?? 0
    if (v < min) min = v
    if (v > max) max = v
  }
  if (min === max) { min -= 1; max += 1 }
  return [min, max]
}

export function normalizeToScene(
  value: number,
  min: number,
  max: number,
  sceneRange = 5
): number {
  return ((value - min) / (max - min) - 0.5) * 2 * sceneRange
}

// ── Shared point parser ────────────────────────────────────────────────────

function parsePoints(data: ApiResponse): ExplorerPoint[] {
  return data.points.map((raw, idx) => {
    const kmeans = Number(raw['KMeans_Cluster'] ?? 0)
    const dbscan = Number(raw['DBSCAN_Cluster'] ?? 0)
    // Trim label to be safe — preprocess.py already strips, but be defensive
    const label  = String(raw['Label'] ?? BENIGN_LABEL).trim()

    const features: Record<string, number> = {}
    for (const key of data.features) {
      features[key] = Number(raw[key] ?? 0)
    }

    return { id: idx, features, kmeans, dbscan, label, isNoise: dbscan === -1 }
  })
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Uniform random 3 000-row sample — used for RAW / K-Means / DBSCAN modes.
 */
export async function fetchExplorerPoints(): Promise<ExplorerPoint[]> {
  const res = await fetch('/api/explorer')
  if (!res.ok) throw new Error(`Backend returned ${res.status}: ${res.statusText}`)
  const data: ApiResponse = await res.json()
  return parsePoints(data)
}

/**
 * Stratified 3 000-row sample — used for Attack Type mode.
 * 800 BENIGN rows + up to 2 200 attack rows so rare labels stay visible.
 * Also returns per-label counts from the response for the legend.
 */
export async function fetchAttackPoints(): Promise<{
  points:      ExplorerPoint[]
  labelCounts: Record<string, number>
}> {
  const res = await fetch('/api/explorer/attack')
  if (!res.ok) throw new Error(`Backend returned ${res.status}: ${res.statusText}`)
  const data: ApiResponse = await res.json()
  return {
    points:      parsePoints(data),
    labelCounts: data.label_counts ?? {},
  }
}
