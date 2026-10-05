import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { id: 'overview',       label: 'Overview' },
  { id: 'dataset',        label: 'Dataset Intelligence' },
  { id: 'explorer',       label: '3D Explorer' },
  { id: 'clustering',     label: 'Clustering' },
  { id: 'rules',          label: 'Association Rules' },
  { id: 'insights',       label: 'Insights' },
]

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <motion.header
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={styles.navbar(scrolled)}
    >
      <div className="container" style={styles.inner}>
        {/* Logo */}
        <button style={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <SentinelIcon />
          <span style={styles.logoText}>SENTINEL</span>
        </button>

        {/* Desktop nav */}
        <nav style={styles.desktopNav}>
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              style={styles.navLink(active === id)}
            >
              {label}
              {active === id && (
                <motion.span
                  layoutId="nav-underline"
                  style={styles.navUnderline}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Status badge */}
        <div style={styles.statusBadge}>
          <span className="pulse-dot" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-green)' }}>
            LIVE ANALYSIS
          </span>
        </div>

        {/* Hamburger */}
        <button style={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
          <span style={styles.bar(menuOpen, 0)} />
          <span style={styles.bar(menuOpen, 1)} />
          <span style={styles.bar(menuOpen, 2)} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            style={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                style={styles.mobileLink(active === id)}
                onClick={() => { scrollToSection(id); setMenuOpen(false) }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function SentinelIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <polygon points="32,4 60,18 60,46 32,60 4,46 4,18"
        fill="none" stroke="#00d4ff" strokeWidth="2.5" />
      <polygon points="32,14 50,23 50,41 32,50 14,41 14,23"
        fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4" />
      <text x="32" y="38" fontFamily="monospace" fontSize="18" fontWeight="bold"
        fill="#00d4ff" textAnchor="middle">S</text>
    </svg>
  )
}

// Inline styles (keeps the component self-contained)
const styles = {
  navbar: (scrolled: boolean): React.CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 'var(--navbar-height)',
    background: scrolled
      ? 'rgba(2, 11, 24, 0.92)'
      : 'transparent',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
    transition: 'all var(--transition-medium)',
  }),
  inner: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  } as React.CSSProperties,
  logoText: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '1.1rem',
    letterSpacing: '0.2em',
    color: 'var(--accent-cyan)',
    textShadow: 'var(--glow-cyan-sm)',
  } as React.CSSProperties,
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
  } as React.CSSProperties,
  navLink: (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem 0.75rem',
    fontSize: '0.82rem',
    fontWeight: 500,
    letterSpacing: '0.03em',
    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  }),
  navUnderline: {
    position: 'absolute',
    bottom: '2px',
    left: '0.75rem',
    right: '0.75rem',
    height: '1px',
    background: 'var(--accent-cyan)',
    boxShadow: '0 0 6px var(--accent-cyan)',
  } as React.CSSProperties,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.75rem',
    border: '1px solid rgba(0,255,136,0.25)',
    borderRadius: '999px',
    background: 'rgba(0,255,136,0.06)',
    flexShrink: 0,
  } as React.CSSProperties,
  hamburger: {
    display: 'none',
    flexDirection: 'column' as const,
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  } as React.CSSProperties,
  bar: (_open: boolean, _idx: number): React.CSSProperties => ({
    width: '22px',
    height: '2px',
    background: 'var(--accent-cyan)',
    borderRadius: '2px',
    transition: 'all var(--transition-fast)',
  }),
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0.5rem 1.5rem 1rem',
    background: 'rgba(2,11,24,0.97)',
    borderTop: '1px solid var(--border-subtle)',
    overflow: 'hidden',
  } as React.CSSProperties,
  mobileLink: (isActive: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.75rem 0',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'color var(--transition-fast)',
  }),
}
