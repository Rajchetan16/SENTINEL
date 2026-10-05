import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',             icon: '◈' },
  { id: 'dataset',    label: 'Dataset Intelligence',  icon: '⬡' },
  { id: 'explorer',   label: '3D Explorer',           icon: '◎' },
  { id: 'clustering', label: 'Clustering Analysis',   icon: '◆' },
  { id: 'rules',      label: 'Association Rules',     icon: '◇' },
  { id: 'insights',   label: 'Insights',              icon: '◉' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Stagger children
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Hero() {
  return (
    <section style={styles.section}>
      {/* Animated hex grid accent */}
      <HexAccent />

      <div className="container" style={styles.container}>
        <motion.div
          style={styles.content}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Label */}
          <motion.div variants={itemVariants} style={styles.topLabel}>
            <span className="pulse-dot" />
            <span className="mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', letterSpacing: '0.15em' }}>
              CICIDS2017 · 2,520,798 RECORDS · 78 FEATURES
            </span>
          </motion.div>

          {/* Main title */}
          <motion.div variants={itemVariants}>
            <h1 style={styles.title}>
              <span className="gradient-text">SENTINEL</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p variants={itemVariants} style={styles.subtitle}>
            Cyber Threat Behavior Mining &amp; 3D Intelligence Dashboard
          </motion.p>

          {/* Description */}
          <motion.p variants={itemVariants} style={styles.description}>
            SENTINEL applies K-Means clustering, DBSCAN density analysis, and Apriori
            association-rule mining to the{' '}
            <span style={{ color: 'var(--accent-cyan)' }}>CICIDS2017</span> dataset — a
            benchmark network-traffic capture spanning Monday through Friday with labeled
            benign and attack flows including DDoS, PortScan, Web Attacks, Brute Force,
            Infiltration, and Bot activity.
          </motion.p>

          {/* CTA row */}
          <motion.div variants={itemVariants} style={styles.ctaRow}>
            <button className="btn btn-primary" onClick={() => scrollTo('overview')}>
              Explore Dashboard ↓
            </button>
            <button className="btn btn-outline" onClick={() => scrollTo('explorer')}>
              3D Visualization
            </button>
          </motion.div>

          {/* Dataset pills */}
          <motion.div variants={itemVariants} style={styles.pills}>
            {['DDoS', 'PortScan', 'Web Attack', 'Brute Force', 'Bot', 'Infiltration', 'BENIGN'].map((label, i) => (
              <span
                key={label}
                className={`badge ${i === 6 ? 'badge-green' : 'badge-red'}`}
              >
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Navigation cards grid */}
        <motion.div
          style={styles.navGrid}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {NAV_ITEMS.map(({ id, label, icon }, i) => (
            <motion.button
              key={id}
              variants={itemVariants}
              custom={i}
              onClick={() => scrollTo(id)}
              className="card"
              style={styles.navCard}
              whileHover={{ y: -6, borderColor: 'var(--border-active)' }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <span style={styles.navIcon}>{icon}</span>
              <span style={styles.navLabel}>{label}</span>
              <span style={styles.navArrow}>→</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        style={styles.scrollHint}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          scroll
        </span>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>↓</span>
      </motion.div>
    </section>
  )
}

// Decorative animated hexagons
function HexAccent() {
  return (
    <div style={styles.hexWrap} aria-hidden>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            ...styles.hexBase,
            width:  `${80 + i * 60}px`,
            height: `${80 + i * 60}px`,
            opacity: 0.06 - i * 0.008,
            top:  `${10 + i * 8}%`,
            right: `${-5 + i * 3}%`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40 + i * 12, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* Corner glow */}
      <div style={styles.cornerGlow} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 'calc(var(--navbar-height) + 2rem)',
    paddingBottom: '4rem',
    overflow: 'hidden',
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  topLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  title: {
    fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.3rem)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  description: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    maxWidth: '520px',
    lineHeight: 1.8,
  },
  ctaRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pills: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  navCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all var(--transition-medium)',
    fontFamily: 'var(--font-sans)',
  },
  navIcon: {
    fontSize: '1.2rem',
    color: 'var(--accent-cyan)',
    flexShrink: 0,
  },
  navLabel: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    flex: 1,
  },
  navArrow: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  scrollHint: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  hexWrap: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  hexBase: {
    position: 'absolute',
    border: '1px solid var(--accent-cyan)',
    borderRadius: '12px',
    transform: 'rotate(30deg)',
  },
  cornerGlow: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '50vw',
    height: '50vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
}
