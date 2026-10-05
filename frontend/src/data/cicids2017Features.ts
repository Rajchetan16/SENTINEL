/**
 * Authoritative list of the 78 numerical features in the CICIDS2017 dataset.
 * Source: CICFlowMeter feature extraction from CICIDS2017 PCAP captures.
 * These are the exact column names after whitespace stripping in preprocess.py.
 */

export interface FeatureMeta {
  name: string          // exact column name
  label: string         // short display label
  unit?: string         // unit hint for tooltip
  group: FeatureGroup
}

export type FeatureGroup =
  | 'Flow'
  | 'Packet Length'
  | 'Flag'
  | 'IAT'
  | 'Subflow'
  | 'Active/Idle'
  | 'Bulk'
  | 'Rate'
  | 'Other'

export const FEATURES: FeatureMeta[] = [
  // ── Flow basics ────────────────────────────────────────────────────────
  { name: 'Destination Port',          label: 'Dst Port',          unit: 'port',  group: 'Flow' },
  { name: 'Flow Duration',             label: 'Flow Duration',     unit: 'μs',    group: 'Flow' },
  { name: 'Total Fwd Packets',         label: 'Fwd Pkts',          unit: 'pkts',  group: 'Flow' },
  { name: 'Total Backward Packets',    label: 'Bwd Pkts',          unit: 'pkts',  group: 'Flow' },
  { name: 'Total Length of Fwd Packets', label: 'Fwd Bytes',       unit: 'B',     group: 'Flow' },
  { name: 'Total Length of Bwd Packets', label: 'Bwd Bytes',       unit: 'B',     group: 'Flow' },

  // ── Packet length — forward ────────────────────────────────────────────
  { name: 'Fwd Packet Length Max',     label: 'Fwd Pkt Len Max',   unit: 'B',     group: 'Packet Length' },
  { name: 'Fwd Packet Length Min',     label: 'Fwd Pkt Len Min',   unit: 'B',     group: 'Packet Length' },
  { name: 'Fwd Packet Length Mean',    label: 'Fwd Pkt Len Mean',  unit: 'B',     group: 'Packet Length' },
  { name: 'Fwd Packet Length Std',     label: 'Fwd Pkt Len Std',   unit: 'B',     group: 'Packet Length' },

  // ── Packet length — backward ───────────────────────────────────────────
  { name: 'Bwd Packet Length Max',     label: 'Bwd Pkt Len Max',   unit: 'B',     group: 'Packet Length' },
  { name: 'Bwd Packet Length Min',     label: 'Bwd Pkt Len Min',   unit: 'B',     group: 'Packet Length' },
  { name: 'Bwd Packet Length Mean',    label: 'Bwd Pkt Len Mean',  unit: 'B',     group: 'Packet Length' },
  { name: 'Bwd Packet Length Std',     label: 'Bwd Pkt Len Std',   unit: 'B',     group: 'Packet Length' },

  // ── Rate features ──────────────────────────────────────────────────────
  { name: 'Flow Bytes/s',              label: 'Flow B/s',          unit: 'B/s',   group: 'Rate' },
  { name: 'Flow Packets/s',            label: 'Flow Pkts/s',       unit: 'pkt/s', group: 'Rate' },

  // ── Flow IAT ───────────────────────────────────────────────────────────
  { name: 'Flow IAT Mean',             label: 'Flow IAT Mean',     unit: 'μs',    group: 'IAT' },
  { name: 'Flow IAT Std',              label: 'Flow IAT Std',      unit: 'μs',    group: 'IAT' },
  { name: 'Flow IAT Max',              label: 'Flow IAT Max',      unit: 'μs',    group: 'IAT' },
  { name: 'Flow IAT Min',              label: 'Flow IAT Min',      unit: 'μs',    group: 'IAT' },

  // ── Fwd IAT ────────────────────────────────────────────────────────────
  { name: 'Fwd IAT Total',             label: 'Fwd IAT Total',     unit: 'μs',    group: 'IAT' },
  { name: 'Fwd IAT Mean',              label: 'Fwd IAT Mean',      unit: 'μs',    group: 'IAT' },
  { name: 'Fwd IAT Std',               label: 'Fwd IAT Std',       unit: 'μs',    group: 'IAT' },
  { name: 'Fwd IAT Max',               label: 'Fwd IAT Max',       unit: 'μs',    group: 'IAT' },
  { name: 'Fwd IAT Min',               label: 'Fwd IAT Min',       unit: 'μs',    group: 'IAT' },

  // ── Bwd IAT ────────────────────────────────────────────────────────────
  { name: 'Bwd IAT Total',             label: 'Bwd IAT Total',     unit: 'μs',    group: 'IAT' },
  { name: 'Bwd IAT Mean',              label: 'Bwd IAT Mean',      unit: 'μs',    group: 'IAT' },
  { name: 'Bwd IAT Std',               label: 'Bwd IAT Std',       unit: 'μs',    group: 'IAT' },
  { name: 'Bwd IAT Max',               label: 'Bwd IAT Max',       unit: 'μs',    group: 'IAT' },
  { name: 'Bwd IAT Min',               label: 'Bwd IAT Min',       unit: 'μs',    group: 'IAT' },

  // ── TCP Flags ──────────────────────────────────────────────────────────
  { name: 'Fwd PSH Flags',             label: 'Fwd PSH',                          group: 'Flag' },
  { name: 'Bwd PSH Flags',             label: 'Bwd PSH',                          group: 'Flag' },
  { name: 'Fwd URG Flags',             label: 'Fwd URG',                          group: 'Flag' },
  { name: 'Bwd URG Flags',             label: 'Bwd URG',                          group: 'Flag' },
  { name: 'FIN Flag Count',            label: 'FIN Flags',                        group: 'Flag' },
  { name: 'SYN Flag Count',            label: 'SYN Flags',                        group: 'Flag' },
  { name: 'RST Flag Count',            label: 'RST Flags',                        group: 'Flag' },
  { name: 'PSH Flag Count',            label: 'PSH Flags',                        group: 'Flag' },
  { name: 'ACK Flag Count',            label: 'ACK Flags',                        group: 'Flag' },
  { name: 'URG Flag Count',            label: 'URG Flags',                        group: 'Flag' },
  { name: 'CWE Flag Count',            label: 'CWE Flags',                        group: 'Flag' },
  { name: 'ECE Flag Count',            label: 'ECE Flags',                        group: 'Flag' },

  // ── Header / misc ──────────────────────────────────────────────────────
  { name: 'Fwd Header Length',         label: 'Fwd Hdr Len',       unit: 'B',     group: 'Other' },
  { name: 'Bwd Header Length',         label: 'Bwd Hdr Len',       unit: 'B',     group: 'Other' },
  { name: 'Fwd Packets/s',             label: 'Fwd Pkts/s',        unit: 'pkt/s', group: 'Rate' },
  { name: 'Bwd Packets/s',             label: 'Bwd Pkts/s',        unit: 'pkt/s', group: 'Rate' },

  // ── Packet length — combined ───────────────────────────────────────────
  { name: 'Packet Length Min',         label: 'Pkt Len Min',       unit: 'B',     group: 'Packet Length' },
  { name: 'Packet Length Max',         label: 'Pkt Len Max',       unit: 'B',     group: 'Packet Length' },
  { name: 'Packet Length Mean',        label: 'Pkt Len Mean',      unit: 'B',     group: 'Packet Length' },
  { name: 'Packet Length Std',         label: 'Pkt Len Std',       unit: 'B',     group: 'Packet Length' },
  { name: 'Packet Length Variance',    label: 'Pkt Len Var',       unit: 'B²',    group: 'Packet Length' },

  // ── Down/Up ratio & size ──────────────────────────────────────────────
  { name: 'Down/Up Ratio',             label: 'Down/Up Ratio',                    group: 'Other' },
  { name: 'Average Packet Size',       label: 'Avg Pkt Size',      unit: 'B',     group: 'Packet Length' },
  { name: 'Avg Fwd Segment Size',      label: 'Fwd Seg Size',      unit: 'B',     group: 'Packet Length' },
  { name: 'Avg Bwd Segment Size',      label: 'Bwd Seg Size',      unit: 'B',     group: 'Packet Length' },
  { name: 'Fwd Header Length.1',       label: 'Fwd Hdr Len.1',     unit: 'B',     group: 'Other' },

  // ── Subflows ───────────────────────────────────────────────────────────
  { name: 'Fwd Avg Bytes/Bulk',        label: 'Fwd Bulk B',        unit: 'B',     group: 'Bulk' },
  { name: 'Fwd Avg Packets/Bulk',      label: 'Fwd Bulk Pkts',                    group: 'Bulk' },
  { name: 'Fwd Avg Bulk Rate',         label: 'Fwd Bulk Rate',                    group: 'Bulk' },
  { name: 'Bwd Avg Bytes/Bulk',        label: 'Bwd Bulk B',        unit: 'B',     group: 'Bulk' },
  { name: 'Bwd Avg Packets/Bulk',      label: 'Bwd Bulk Pkts',                    group: 'Bulk' },
  { name: 'Bwd Avg Bulk Rate',         label: 'Bwd Bulk Rate',                    group: 'Bulk' },
  { name: 'Subflow Fwd Packets',       label: 'Sub Fwd Pkts',                     group: 'Subflow' },
  { name: 'Subflow Fwd Bytes',         label: 'Sub Fwd B',         unit: 'B',     group: 'Subflow' },
  { name: 'Subflow Bwd Packets',       label: 'Sub Bwd Pkts',                     group: 'Subflow' },
  { name: 'Subflow Bwd Bytes',         label: 'Sub Bwd B',         unit: 'B',     group: 'Subflow' },

  // ── Init win bytes ─────────────────────────────────────────────────────
  { name: 'Init_Win_bytes_forward',    label: 'Init Win Fwd',      unit: 'B',     group: 'Other' },
  { name: 'Init_Win_bytes_backward',   label: 'Init Win Bwd',      unit: 'B',     group: 'Other' },
  { name: 'act_data_pkt_fwd',          label: 'Act Data Pkt Fwd',                 group: 'Other' },
  { name: 'min_seg_size_forward',      label: 'Min Seg Fwd',       unit: 'B',     group: 'Other' },

  // ── Active / Idle ──────────────────────────────────────────────────────
  { name: 'Active Mean',               label: 'Active Mean',       unit: 'μs',    group: 'Active/Idle' },
  { name: 'Active Std',                label: 'Active Std',        unit: 'μs',    group: 'Active/Idle' },
  { name: 'Active Max',                label: 'Active Max',        unit: 'μs',    group: 'Active/Idle' },
  { name: 'Active Min',                label: 'Active Min',        unit: 'μs',    group: 'Active/Idle' },
  { name: 'Idle Mean',                 label: 'Idle Mean',         unit: 'μs',    group: 'Active/Idle' },
  { name: 'Idle Std',                  label: 'Idle Std',          unit: 'μs',    group: 'Active/Idle' },
  { name: 'Idle Max',                  label: 'Idle Max',          unit: 'μs',    group: 'Active/Idle' },
  { name: 'Idle Min',                  label: 'Idle Min',          unit: 'μs',    group: 'Active/Idle' },
]

/** Feature names as a plain string array for dropdowns */
export const FEATURE_NAMES: string[] = FEATURES.map(f => f.name)

/** Lookup by name */
export const FEATURE_MAP: Record<string, FeatureMeta> = Object.fromEntries(
  FEATURES.map(f => [f.name, f])
)

// Default axis selections — three informative, visually separating features
export const DEFAULT_X = 'Flow Duration'
export const DEFAULT_Y = 'Total Length of Fwd Packets'
export const DEFAULT_Z = 'Flow Packets/s'
export const DEFAULT_COLOR_FEATURE = 'Packet Length Mean'
export const DEFAULT_SIZE_FEATURE  = 'Total Fwd Packets'
