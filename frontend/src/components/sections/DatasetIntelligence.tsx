import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import { motion } from 'framer-motion'

// Actual label distribution from CICIDS2017 (approximate published values)
const LABEL_DIST = [
  { label: 'BENIGN',                    count: 2_273_097, color: 'var(--accent-green)' },
  { label: 'DoS Hulk',                  count:    231_073, color: 'var(--accent-red)'    },
  { label: 'PortScan',                  count:    158_930, color: 'var(--accent-blue)'   },
  { label: 'DDoS',                      count:    128_027, color: '#ff6b35'              },
  { label: 'DoS GoldenEye',             count:     10_293, color: '#ff3366'              },
  { label: 'FTP-Patator',               count:      7_938, color: 'var(--accent-purple)' },
  { label: 'SSH-Patator',               count:      5_897, color: '#a855f7'              },
  { label: 'DoS slowloris',             count:      5_796, color: '#f59e0b'              },
  { label: 'DoS Slowhttptest',          count:      5_499, color: '#ef4444'              },
  { label: 'Bot',                       count:      1_966, color: '#6366f1'              },
  { label: 'Web Attack - Brute Force',  count:      1_507, color: '#ec4899'              },
  { label: 'Web Attack - XSS',          count:        652, color: '#14b8a6'              },
  { label: 'Infiltration',              count:         36, color: '#84cc16'              },
  { label: 'Web Attack - Sql Injection',count:         21, color: '#f97316'              },
  { label: 'Heartbleed',                count:         11, color: '#06b6d4'              },
]

const total = LABEL_DIST.reduce((s, r) => s + r.count, 0)

const FILES = [
  { name: 'Monday-WorkingHours',                  rows: '529,918', note: 'Benign only — baseline traffic'     },
  { name: 'Tuesday-WorkingHours',                 rows: '445,909', note: 'FTP & SSH Brute Force'              },
  { name: 'Wednesday-workingHours',               rows: '692,703', note: 'DoS / Slowloris / GoldenEye / Hulk' },
  { name: 'Thursday-Morning-WebAttacks',          rows: '170,366', note: 'SQL Injection, XSS, Brute Force'    },
  { name: 'Thursday-Afternoon-Infilteration',     rows: '288,602', note: 'Infiltration + benign'              },
  { name: 'Friday-Morning',                       rows: '191,033', note: 'Benign + Botnet'                    },
  { name: 'Friday-Afternoon-PortScan',            rows: '286,467', note: 'Port scanning'                      },
  { name: 'Friday-Afternoon-DDos',                rows: '225,745', note: 'DDoS attack traffic'                },
]

export default function DatasetIntelligence() {
  const maxCount = LABEL_DIST[0].count

  return (
    <SectionWrapper id="dataset" style={{ background: 'rgba(7,20,40,0.4)' }}>
      <div className="container">
        <SectionHeader
          label="Dataset Intelligence"
          title="CICIDS2017"
          titleAccent="Traffic Profile"
          description="The Canadian Institute for Cybersecurity Intrusion Detection dataset captures five days of realistic network activity. Each row is a bidirectional flow with 78 hand-crafted features extracted by CICFlowMeter."
        />

        {/* Label distribution bar chart */}
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Label Distribution · {total.toLocaleString()} total rows
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '3.5rem' }}>
          {LABEL_DIST.map(({ label, count, color }, i) => {
            const pct = (count / maxCount) * 100
            return (
              <motion.div
                key={label}
                style={{ display: 'grid', gridTemplateColumns: '220px 1fr 100px', gap: '0.75rem', alignItems: 'center' }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </span>
                <div style={{ background: 'var(--bg-card)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: color, borderRadius: '4px' }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {count.toLocaleString()}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Files table */}
        <SectionHeader label="Source Files" title="8 Daily" titleAccent="CSV Captures" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {FILES.map(({ name, rows, note }, i) => (
            <motion.div
              key={name}
              className="card"
              style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{name}.csv</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{note}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', flexShrink: 0 }}>{rows}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
