import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import { motion } from 'framer-motion'

const INSIGHTS = [
  {
    icon: '🎯',
    accent: 'var(--accent-cyan)',
    title: 'K-Means Reveals Traffic Regimes',
    body: 'Five clusters consistently separate high-volume benign browsing, low-and-slow scanning, bursty DoS floods, bi-directional service traffic, and near-zero-byte probes — without ever seeing a label.',
  },
  {
    icon: '🔴',
    accent: 'var(--accent-red)',
    title: 'DBSCAN Isolates Rare Attacks',
    body: 'Low-frequency attacks (Heartbleed, SQL Injection, Infiltration) appear as DBSCAN noise points (-1), confirming they are statistically anomalous rather than belonging to any dense cluster.',
  },
  {
    icon: '⛓️',
    accent: 'var(--accent-purple)',
    title: 'Apriori Links Features to Labels',
    body: 'High-confidence rules connect SmallAvgPacket to PortScan, HighPacketRate+HighByteRate to DDoS, and CommonAttackPort to Web Attacks — giving interpretable, human-readable signatures.',
  },
  {
    icon: '⚠️',
    accent: 'var(--accent-green)',
    title: 'Class Imbalance Is Extreme',
    body: 'BENIGN traffic is 90 % of the dataset. Any production detector must weight minority attack classes or use stratified sampling — raw accuracy metrics are misleading without this correction.',
  },
  {
    icon: '📐',
    accent: 'var(--accent-blue)',
    title: 'Feature Scale Matters',
    body: 'Flow Bytes/s and Packet Rate span six orders of magnitude. StandardScaler normalization is essential before distance-based methods; unscaled data would collapse all clusters onto a single axis.',
  },
  {
    icon: '🔗',
    accent: '#f59e0b',
    title: 'Mining ≠ Detection',
    body: 'These techniques surface structure and associations in historical data. A production IDS would combine these findings with supervised models, feature selection, and real-time stream processing.',
  },
]

const NEXT_STEPS = [
  '3D React Three Fiber visualization of K-Means / DBSCAN clusters',
  'FastAPI backend to serve real CSV results as JSON',
  'Interactive rule explorer with live filtering by lift, confidence, and label',
  'PCA / t-SNE dimension reduction for the 3D point cloud',
  'Supervised classification comparison (Random Forest baseline)',
]

export default function Insights() {
  return (
    <SectionWrapper id="insights" style={{ background: 'rgba(7,20,40,0.4)', paddingBottom: '8rem' }}>
      <div className="container">
        <SectionHeader
          label="Insights"
          title="Key Findings &amp;"
          titleAccent="Takeaways"
          description="What three data-mining techniques tell us about network intrusion patterns in CICIDS2017."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>
          {INSIGHTS.map(({ icon, accent, title, body }, i) => (
            <motion.div
              key={title}
              className="card"
              style={{ borderLeft: `2px solid ${accent}` }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: accent }}>{title}</h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </motion.div>
          ))}
        </div>

        {/* Next steps */}
        <SectionHeader label="Road Map" title="Next" titleAccent="Development Phase" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {NEXT_STEPS.map((step, i) => (
            <motion.div
              key={step}
              style={styles.stepRow}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', flexShrink: 0 }}>
                0{i + 1}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{step}</span>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          style={styles.footer}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', letterSpacing: '0.3em', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              SENTINEL
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Cybersecurity Data Mining Showcase · CICIDS2017 · K-Means · DBSCAN · Apriori
            </p>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}

const styles: Record<string, React.CSSProperties> = {
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0.85rem 1.25rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  footer: {
    marginTop: '5rem',
    paddingTop: '2.5rem',
    borderTop: '1px solid var(--border-subtle)',
  },
}
