import { useEffect, useRef, useState } from 'react'
import { ArrowIcon, LensMark } from '../ui/Icons'

const links = [
  { id: 'overview', label: 'The approach' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'research', label: 'Research' },
]
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const toggle = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-15% 0px -45% 0px' },
    )
    for (const id of ['home', ...links.map((l) => l.id)]) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    const outside = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open])
  return (
    <header
      ref={header}
      className={`site-header ${scrolled || open ? 'is-scrolled' : ''}`}
    >
      <div className="nav-inner">
        <a
          href="#home"
          className="wordmark"
          aria-label="Sentinel home"
          onClick={() => setOpen(false)}
        >
          <LensMark />
          <span>
            SENTINEL<span className="wordmark-period">.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? 'location' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#explorer" className="nav-launch">
          Launch explorer <ArrowIcon />
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <span className={open ? 'menu-lines open' : 'menu-lines'}>
            <i />
            <i />
          </span>
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}>
              {l.label}
              <ArrowIcon />
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
