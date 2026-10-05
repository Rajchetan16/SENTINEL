/**
 * ⚠️  DEMO DATA — NOT real CICIDS2017 measurements.
 *
 * Deterministic seeded pseudo-random generator produces ~2 000 points
 * that mimic the statistical shape of real CICIDS2017 network flows.
 * Each point carries all 78 feature values so axis switching works.
 *
 * Replace this module with a real CSV/API loader in the next phase.
 */

import { FEATURE_NAMES } from './cicids2017Features'

// ── Types ─────────────────────────────────────────────────────────────────

export type VisualizationMode = 'RAW' | 'KMEANS' | 'DBSCAN' | 'ATTACK'

export interface DemoPoint {
  id: number
  /** All 78 numerical feature values keyed by exact CICIDS2017 column name */
  features: Record<string, number>
  /** K-Means cluster id  0–4 */
  kmeans: number
  /** DBSCAN cluster id  0–N or -1 (noise) */
  dbscan: number
  /** Attack / traffic label */
  label: AttackLabel
  /** Is this a DBSCAN noise point? */
  isNoise: boolean
}

export type AttackLabel =
  | 'BENIGN'
  | 'DDoS'
  | 'PortScan'
  | 'DoS Hulk'
  | 'DoS GoldenEye'
  | 'FTP-Patator'
  | 'SSH-Patator'
  | 'Bot'
  | 'Web Attack'
  | 'Infiltration'
  | 'Heartbleed'

// ── Colour maps ────────────────────────────────────────────────────────────

export const KMEANS_COLORS: Record<number, string> = {
  0: '#00d4ff',
  1: '#0066ff',
  2: '#7b2fff',
  3: '#00ff88',
  4: '#ff6b35',
}

export const ATTACK_COLORS: Record<AttackLabel, string> = {
  BENIGN:         '#00ff88',
  DDoS:           '#ff3366',
  PortScan:       '#0066ff',
  'DoS Hulk':     '#ff6b35',
  'DoS GoldenEye':'#ff9500',
  'FTP-Patator':  '#a855f7',
  'SSH-Patator':  '#c084fc',
  Bot:            '#6366f1',
  'Web Attack':   '#ec4899',
  Infiltration:   '#84cc16',
  Heartbleed:     '#06b6d4',
}

export const DBSCAN_NOISE_COLOR = '#ff3366'
export const DBSCAN_CORE_COLORS: string[] = [
  '#00d4ff', '#0066ff', '#7b2fff', '#00ff88', '#ff6b35',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#c084fc',
]

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ── Cluster definitions for demo realism ─────────────────────────────────

interface ClusterDef {
  label: AttackLabel
  kmeans: number
  dbscan: number          // -1 = noise cluster
  count: number
  // Rough feature "centres" for the three default axes — everything else is noise
  flowDurationMean: number; flowDurationStd: number
  fwdBytesMean:     number; fwdBytesStd:     number
  pktRateMean:      number; pktRateStd:      number
  pktLenMean:       number; pktLenStd:       number
  fwdPktsMean:      number; fwdPktsStd:      number
  noiseProb:        number  // probability of being DBSCAN noise
}

const CLUSTER_DEFS: ClusterDef[] = [
  // Cluster 0 — normal web browsing
  { label: 'BENIGN',       kmeans: 0, dbscan: 0,  count: 700,
    flowDurationMean: 0.5,  flowDurationStd: 0.25,
    fwdBytesMean:     0.35, fwdBytesStd:     0.15,
    pktRateMean:      0.25, pktRateStd:      0.10,
    pktLenMean:       0.40, pktLenStd:       0.12,
    fwdPktsMean:      0.30, fwdPktsStd:      0.10,
    noiseProb: 0.01 },

  // Cluster 1 — DDoS flood (high rate, tiny packets)
  { label: 'DDoS',         kmeans: 1, dbscan: 1,  count: 250,
    flowDurationMean: 0.1,  flowDurationStd: 0.05,
    fwdBytesMean:     0.05, fwdBytesStd:     0.03,
    pktRateMean:      0.95, pktRateStd:      0.05,
    pktLenMean:       0.06, pktLenStd:       0.03,
    fwdPktsMean:      0.90, fwdPktsStd:      0.05,
    noiseProb: 0.03 },

  // Cluster 2 — PortScan (many small, short flows)
  { label: 'PortScan',     kmeans: 2, dbscan: 2,  count: 200,
    flowDurationMean: 0.05, flowDurationStd: 0.03,
    fwdBytesMean:     0.02, fwdBytesStd:     0.02,
    pktRateMean:      0.45, pktRateStd:      0.12,
    pktLenMean:       0.04, pktLenStd:       0.02,
    fwdPktsMean:      0.05, fwdPktsStd:      0.03,
    noiseProb: 0.04 },

  // Cluster 3 — DoS Hulk (large forward burst)
  { label: 'DoS Hulk',     kmeans: 3, dbscan: 3,  count: 200,
    flowDurationMean: 0.2,  flowDurationStd: 0.08,
    fwdBytesMean:     0.85, fwdBytesStd:     0.08,
    pktRateMean:      0.70, pktRateStd:      0.10,
    pktLenMean:       0.75, pktLenStd:       0.10,
    fwdPktsMean:      0.80, fwdPktsStd:      0.07,
    noiseProb: 0.03 },

  // Cluster 4 — Brute force / patator (medium rate, repetitive)
  { label: 'FTP-Patator',  kmeans: 4, dbscan: 4,  count: 150,
    flowDurationMean: 0.55, flowDurationStd: 0.12,
    fwdBytesMean:     0.20, fwdBytesStd:     0.07,
    pktRateMean:      0.30, pktRateStd:      0.08,
    pktLenMean:       0.22, pktLenStd:       0.06,
    fwdPktsMean:      0.25, fwdPktsStd:      0.06,
    noiseProb: 0.05 },

  // Rare / noise attacks — always DBSCAN noise (-1)
  { label: 'Heartbleed',   kmeans: 1, dbscan: -1, count: 11,
    flowDurationMean: 0.30, flowDurationStd: 0.05,
    fwdBytesMean:     0.15, fwdBytesStd:     0.05,
    pktRateMean:      0.10, pktRateStd:      0.04,
    pktLenMean:       0.12, pktLenStd:       0.04,
    fwdPktsMean:      0.12, fwdPktsStd:      0.04,
    noiseProb: 1.0 },

  { label: 'Infiltration', kmeans: 0, dbscan: -1, count: 36,
    flowDurationMean: 0.75, flowDurationStd: 0.10,
    fwdBytesMean:     0.45, fwdBytesStd:     0.08,
    pktRateMean:      0.15, pktRateStd:      0.06,
    pktLenMean:       0.38, pktLenStd:       0.08,
    fwdPktsMean:      0.20, fwdPktsStd:      0.06,
    noiseProb: 1.0 },

  { label: 'Web Attack',   kmeans: 2, dbscan: -1, count: 80,
    flowDurationMean: 0.40, flowDurationStd: 0.10,
    fwdBytesMean:     0.25, fwdBytesStd:     0.07,
    pktRateMean:      0.20, pktRateStd:      0.07,
    pktLenMean:       0.20, pktLenStd:       0.07,
    fwdPktsMean:      0.18, fwdPktsStd:      0.06,
    noiseProb: 0.85 },
]

// ── Feature generation ────────────────────────────────────────────────────

/** Map a [0,1] normalised value to a plausible raw CICIDS2017 range */
const FEATURE_RANGES: Record<string, [number, number]> = {
  'Destination Port':            [0,    65535],
  'Flow Duration':               [0,    1.2e8],
  'Total Fwd Packets':           [1,    50000],
  'Total Backward Packets':      [0,    50000],
  'Total Length of Fwd Packets': [0,    2e7],
  'Total Length of Bwd Packets': [0,    2e7],
  'Fwd Packet Length Max':       [0,    65535],
  'Fwd Packet Length Min':       [0,    1500],
  'Fwd Packet Length Mean':      [0,    1500],
  'Fwd Packet Length Std':       [0,    500],
  'Bwd Packet Length Max':       [0,    65535],
  'Bwd Packet Length Min':       [0,    1500],
  'Bwd Packet Length Mean':      [0,    1500],
  'Bwd Packet Length Std':       [0,    500],
  'Flow Bytes/s':                [0,    1e8],
  'Flow Packets/s':              [0,    1e6],
  'Flow IAT Mean':               [0,    1.2e8],
  'Flow IAT Std':                [0,    1.2e8],
  'Flow IAT Max':                [0,    1.2e8],
  'Flow IAT Min':                [0,    1.2e8],
  'Packet Length Mean':          [0,    1500],
  'Packet Length Std':           [0,    500],
  'Packet Length Variance':      [0,    250000],
}

function denorm(name: string, v: number): number {
  const range = FEATURE_RANGES[name] ?? [0, 1]
  return range[0] + v * (range[1] - range[0])
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }

function gauss(rng: () => number, mean: number, std: number): number {
  // Box-Muller
  const u = rng(), v = rng()
  const n = Math.sqrt(-2 * Math.log(Math.max(u, 1e-10))) * Math.cos(2 * Math.PI * v)
  return clamp01(mean + std * n)
}

// ── Public generator ──────────────────────────────────────────────────────

export function generateDemoPoints(): DemoPoint[] {
  const rng = mulberry32(0xDEADBEEF)   // fixed seed → deterministic
  const points: DemoPoint[] = []
  let id = 0

  for (const def of CLUSTER_DEFS) {
    for (let i = 0; i < def.count; i++) {
      // Derive per-point noise from cluster baseline
      const normX = gauss(rng, def.flowDurationMean, def.flowDurationStd)
      const normY = gauss(rng, def.fwdBytesMean,     def.fwdBytesStd)
      const normZ = gauss(rng, def.pktRateMean,       def.pktRateStd)
      const normPktLen = gauss(rng, def.pktLenMean,   def.pktLenStd)
      const normFwdPkts = gauss(rng, def.fwdPktsMean, def.fwdPktsStd)

      // Build full 78-feature record; features not explicitly modelled get
      // random values correlated loosely with the cluster's normX/Y/Z
      const features: Record<string, number> = {}
      for (const name of FEATURE_NAMES) {
        let v: number
        switch (name) {
          case 'Flow Duration':               v = normX; break
          case 'Total Length of Fwd Packets': v = normY; break
          case 'Flow Packets/s':              v = normZ; break
          case 'Packet Length Mean':          v = normPktLen; break
          case 'Total Fwd Packets':           v = normFwdPkts; break
          case 'Total Backward Packets':      v = gauss(rng, normY * 0.7, 0.08); break
          case 'Total Length of Bwd Packets': v = gauss(rng, normY * 0.5, 0.10); break
          case 'Flow Bytes/s':                v = gauss(rng, normZ * 0.85, 0.07); break
          case 'Fwd Packet Length Mean':      v = gauss(rng, normPktLen, 0.06); break
          case 'Bwd Packet Length Mean':      v = gauss(rng, normPktLen * 0.7, 0.06); break
          case 'SYN Flag Count':
            v = def.label === 'DDoS' || def.label === 'PortScan' ? gauss(rng, 0.8, 0.1) : gauss(rng, 0.1, 0.05)
            break
          case 'Destination Port':
            v = rng()   // genuinely random port
            break
          default:
            // Correlated noise for all remaining features
            v = clamp01(normX * 0.3 + normY * 0.3 + normZ * 0.2 + (rng() - 0.5) * 0.4)
        }
        features[name] = denorm(name, v)
      }

      const isNoise = rng() < def.noiseProb
      points.push({
        id: id++,
        features,
        kmeans: def.kmeans,
        dbscan: isNoise ? -1 : def.dbscan,
        label:  def.label,
        isNoise,
      })
    }
  }

  return points
}

// ── Normalise helpers (for Three.js coordinate mapping) ──────────────────

/**
 * Given an array of points and a feature name, return min/max for normalization.
 */
export function featureExtent(points: DemoPoint[], featureName: string): [number, number] {
  let min = Infinity, max = -Infinity
  for (const p of points) {
    const v = p.features[featureName] ?? 0
    if (v < min) min = v
    if (v > max) max = v
  }
  if (min === max) { min -= 1; max += 1 }
  return [min, max]
}

/**
 * Normalise a raw feature value to [-5, 5] scene units.
 */
export function normalizeToScene(
  value: number,
  min: number,
  max: number,
  sceneRange = 5
): number {
  return ((value - min) / (max - min) - 0.5) * 2 * sceneRange
}
