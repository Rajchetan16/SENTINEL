import { lazy, Suspense, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useSceneActivity } from '../../hooks/useSceneActivity'
import { ArrowIcon } from '../ui/Icons'
import SceneBoundary from '../ui/SceneBoundary'

const SentinelLens = lazy(() => import('../three/SentinelLens'))
function LensFallback() {
  return (
    <div className="lens-fallback" aria-hidden="true">
      <div />
      <div />
      <div />
      <span />
    </div>
  )
}
export default function Hero() {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [compact, setCompact] = useState(window.innerWidth < 768)
  const { ref, active } = useSceneActivity()
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const running = active && !paused && !reduced
  return (
    <section id="home" className="hero" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orbit" aria-hidden="true" />
      <div className="hero-topline">
        <span className="eyebrow">
          <i className="status-dot" /> A NEW PERSPECTIVE ON NETWORK BEHAVIOR
        </span>
        <span className="hero-edition">RESEARCH EDITION / 01</span>
      </div>
      <div
        className="hero-art"
        ref={ref}
        role="img"
        aria-label="An artistic lens surrounding a violet particle constellation; conceptual artwork, not network data."
      >
        <div className="lens-aura" />
        <SceneBoundary fallback={<LensFallback />}>
          <Suspense fallback={<LensFallback />}>
            <SentinelLens running={running} compact={compact} />
          </Suspense>
        </SceneBoundary>
        <div className="art-annotation annotation-top">
          <span className="annotation-cross">+</span>
          <span>
            SENTINEL LENS
            <br />
            <b>BEHAVIOR, IN FOCUS</b>
          </span>
        </div>
        <div className="art-annotation annotation-bottom">
          <span className="annotation-line" />
          <span>STRUCTURE WITHIN THE SIGNAL</span>
        </div>
      </div>
      <div className="hero-copy">
        <h1 id="hero-title">
          See the pattern.
          <br />
          Investigate the
          <br />
          <span>exception.</span>
        </h1>
        <p>
          A clearer view of complex network behavior.
          <br className="desktop-break" /> Explore the clusters, connections,
          and outliers
          <br className="desktop-break" /> hidden inside the data.
        </p>
        <div className="hero-actions">
          <a href="#explorer" className="button button-primary">
            Enter the explorer <ArrowIcon />
          </a>
          <a href="#overview" className="text-link">
            Discover the approach <ArrowIcon className="arrow-diagonal" />
          </a>
        </div>
      </div>
      <div className="hero-bottom">
        <a href="#overview" className="scroll-cue">
          <span>↓</span> SCROLL TO DISCOVER
        </a>
        <div className="art-controls">
          <span>CONCEPTUAL VISUALIZATION</span>
          <button
            onClick={() => setPaused((p) => !p)}
            disabled={!!reduced}
            aria-label={paused ? 'Play animation' : 'Pause animation'}
            aria-pressed={paused || !!reduced}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              {paused || reduced ? (
                <path d="M3 2l7 4-7 4V2Z" stroke="currentColor" />
              ) : (
                <path d="M4 2v8M8 2v8" stroke="currentColor" />
              )}
            </svg>
            {reduced
              ? 'Reduced motion'
              : paused
                ? 'Play motion'
                : 'Pause motion'}
          </button>
        </div>
      </div>
    </section>
  )
}
