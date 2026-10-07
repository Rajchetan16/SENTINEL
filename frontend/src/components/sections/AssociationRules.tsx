import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'
import { motion } from 'framer-motion'

// Representative example rules to illustrate the technique (not fabricated results).
// These are illustrative of the *kind* of rule expected — actual values come from CSV.
const EXAMPLE_RULES = [
  { antecedents: 'Label=DDoS',                             consequents: 'HighPacketRate',     support: '0.045', confidence: '0.97', lift: '1.91' },
  { antecedents: 'HighPacketRate, HighByteRate',            consequents: 'Label=DDoS',         support: '0.043', confidence: '0.88', lift: '1.73' },
  { antecedents: 'Label=PortScan',                          consequents: 'SmallAvgPacket',     support: '0.031', confidence: '0.94', lift: '2.14' },
  { antecedents: 'SmallAvgPacket, CommonAttackPort',        consequents: 'Label=PortScan',     support: '0.028', confidence: '0.85', lift: '1.96' },
  { antecedents: 'Label=Web Attack-Brute Force',            consequents: 'CommonAttackPort',   support: '0.015', confidence: '0.91', lift: '2.08' },
  { antecedents: 'HighFwdBytes',                            consequents: 'Label=BENIGN',       support: '0.120', confidence: '0.71', lift: '0.63' },
]

const ITEMS_USED = [
  { name: 'Label=<attack>',     desc: 'One boolean per unique traffic label' },
  { name: 'HighFlowDuration',   desc: 'Flow duration > sample median' },
  { name: 'HighFwdBytes',       desc: 'Forward bytes > sample median' },
  { name: 'HighBwdBytes',       desc: 'Backward bytes > sample median' },
  { name: 'HighPacketRate',     desc: 'Flow packets/s > median (inf → 0)' },
  { name: 'HighByteRate',       desc: 'Flow bytes/s > median (inf → 0)' },
  { name: 'CommonAttackPort',   desc: 'Dst port ∈ {21,22,23,80,443,445,3389,8080}' },
  { name: 'SmallAvgPacket',     desc: 'Avg packet size < 25th percentile' },
]

export default function AssociationRules() {
  return (
    <SectionWrapper id="rules">
      <div className="container">
        <SectionHeader
          label="Association Rules"
          title="Apriori"
          titleAccent="Rule Mining"
          description="Apriori discovers co-occurrence patterns between traffic features and attack labels. Each rule reads: 'when these items appear together, these other items appear too — with this confidence and lift.'"
        />

        {/* Config */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <StatCard value="20K"   label="Sample Size"    accent="var(--accent-cyan)"   />
          <StatCard value="0.01"  label="Min Support"    accent="var(--accent-blue)"   />
          <StatCard value="0.50"  label="Min Confidence" accent="var(--accent-purple)" />
          <StatCard value="Lift ↓" label="Sort Metric"   accent="var(--accent-green)"  />
        </div>

        {/* Transaction items */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Transaction Items Used</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {ITEMS_USED.map((item, i) => (
            <motion.div
              key={item.name}
              className="card"
              style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', flexShrink: 0, paddingTop: '2px' }}>▸</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Example rules table */}
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Illustrative Rules
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
            (actual values loaded from CSV in next phase)
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Antecedents', 'Consequents', 'Support', 'Confidence', 'Lift'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_RULES.map((rule, i) => (
                <motion.tr
                  key={i}
                  style={styles.tr(i)}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <td style={styles.tdMono}>{rule.antecedents}</td>
                  <td style={styles.tdMono}>{rule.consequents}</td>
                  <td style={styles.tdNum}>{rule.support}</td>
                  <td style={styles.tdNum}>{rule.confidence}</td>
                  <td style={{ ...styles.tdNum, color: parseFloat(rule.lift) > 1 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {rule.lift}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.resultNote}>
          <span>📄</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Full rules → <code>data/processed/results/apriori_rules.csv</code>
          </span>
        </div>
      </div>
    </SectionWrapper>
  )
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    overflow: 'hidden',
  } as React.CSSProperties,
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    color: 'var(--accent-cyan)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
    background: 'rgba(198,172,245,0.04)',
    fontSize: '0.72rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  tr: (i: number): React.CSSProperties => ({
    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
  }),
  tdMono: {
    padding: '0.6rem 1rem',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-subtle)',
    maxWidth: '220px',
  } as React.CSSProperties,
  tdNum: {
    padding: '0.6rem 1rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-subtle)',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  resultNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.25rem',
    padding: '0.6rem 1rem',
    background: 'rgba(198,172,245,0.04)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
  } as React.CSSProperties,
}
