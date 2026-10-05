import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import StatCard from '../ui/StatCard'
import { motion } from 'framer-motion'

const PIPELINE = [
  { step: '01', title: 'Raw Data Ingestion',     desc: '8 CICIDS2017 PCAP-derived CSV files loaded and concatenated into a single DataFrame.' },
  { step: '02', title: 'Preprocessing',           desc: 'Column names stripped, labels normalized, ±Inf replaced, NaN rows and duplicates removed.' },
  { step: '03', title: 'K-Means Clustering',      desc: '50,000-row sample standardized and grouped into k=5 behavioral clusters.' },
  { step: '04', title: 'DBSCAN Density Analysis', desc: 'Same sample run through DBSCAN (ε=3, minPts=10) to discover arbitrary-shaped clusters and noise.' },
  { step: '05', title: 'Apriori Rule Mining',     desc: '20,000-row transaction matrix mined for frequent itemsets and high-confidence association rules.' },
]

export default function Overview() {
  return (
    <SectionWrapper id="overview">
      <div className="container">
        <SectionHeader
          label="Project Overview"
          title="Three Mining Techniques,"
          titleAccent="One Dataset."
          description="SENTINEL applies classical data-mining algorithms to CICIDS2017 to surface hidden patterns in network traffic, reveal attack signatures, and expose behavioral clusters invisible to threshold-based detection."
        />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>
          <StatCard value="2.52M"  label="Total Records"      delay={0}    />
          <StatCard value="78"     label="Numerical Features"  delay={0.08} accent="var(--accent-blue)"   />
          <StatCard value="15"     label="Attack Categories"   delay={0.16} accent="var(--accent-red)"    />
          <StatCard value="50K"    label="Clustering Sample"   delay={0.24} accent="var(--accent-purple)" />
          <StatCard value="20K"    label="Apriori Sample"      delay={0.32} accent="var(--accent-green)"  />
        </div>

        {/* Pipeline */}
        <SectionHeader label="Processing Pipeline" title="From Raw PCAPs to" titleAccent="Mined Intelligence" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {PIPELINE.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              className="card"
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderRadius: i === 0 ? '12px 12px 4px 4px' : i === PIPELINE.length - 1 ? '4px 4px 12px 12px' : '4px' }}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)', opacity: 0.6, flexShrink: 0, paddingTop: '2px' }}>{step}</span>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
