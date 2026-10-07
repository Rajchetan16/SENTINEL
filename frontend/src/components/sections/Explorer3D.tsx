import { lazy, Suspense, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import SceneBoundary from '../ui/SceneBoundary'
const ThreatExplorer3D = lazy(() => import('../ThreatExplorer3D'))
export default function Explorer3D() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '250px 0px' })
  const [attempt, setAttempt] = useState(0)
  return (
    <section id="explorer" className="explorer-section section-wrapper">
      <div className="container">
        <div className="section-intro">
          <div>
            <span className="eyebrow">
              <span className="section-number">02 /</span> THE EXPLORER
            </span>
            <h2>
              Your perspective.
              <br />
              <span className="muted-heading">Every point matters.</span>
            </h2>
          </div>
          <div className="explorer-intro">
            <p>
              Step inside a sample of real network flows. Change your axes,
              switch perspectives, and select a point to inspect its features.
            </p>
            <span className="source-label">
              <i className="status-dot" /> CICIDS2017 · HISTORICAL DATA
            </span>
          </div>
        </div>
        <div ref={ref} className="explorer-mount">
          {inView ? (
            <SceneBoundary
              key={attempt}
              fallback={
                <div className="scene-error" role="alert">
                  <h3>The 3D view couldn’t start.</h3>
                  <p>
                    Try a browser with WebGL enabled. The research below remains
                    available.
                  </p>
                  <button
                    className="button button-secondary"
                    onClick={() => setAttempt((v) => v + 1)}
                  >
                    Try again
                  </button>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="workspace-loading" role="status">
                    Preparing the explorer…
                  </div>
                }
              >
                <ThreatExplorer3D />
              </Suspense>
            </SceneBoundary>
          ) : (
            <div className="workspace-loading" role="status">
              The explorer loads as you approach.
            </div>
          )}
        </div>
        <div className="explorer-footnote">
          <span>01 — RAW FLOWS</span>
          <span>02 — K-MEANS</span>
          <span>03 — DBSCAN</span>
          <span>04 — ATTACK LABELS</span>
        </div>
      </div>
    </section>
  )
}
