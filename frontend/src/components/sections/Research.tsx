import { lazy, Suspense, useRef, useState, type KeyboardEvent } from 'react'
import { useInView } from 'framer-motion'
const Dataset = lazy(() => import('./DatasetIntelligence'))
const Clustering = lazy(() => import('./ClusteringAnalysis'))
const Rules = lazy(() => import('./AssociationRules'))
const Insights = lazy(() => import('./Insights'))
const tabs = [
  { id: 'dataset', label: 'The dataset', component: Dataset },
  { id: 'clustering', label: 'Clustering results', component: Clustering },
  { id: 'rules', label: 'Association rules', component: Rules },
  { id: 'insights', label: 'Notes & limitations', component: Insights },
]
export default function Research() {
  const [selected, setSelected] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { once: true, margin: '150px 0px' })
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const Content = tabs[selected].component
  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft')
      next = (index + tabs.length - 1) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    setSelected(next)
    buttons.current[next]?.focus()
  }
  return (
    <section id="research" className="research-section section-wrapper">
      <div className="container">
        <div className="section-intro">
          <div>
            <span className="eyebrow">
              <span className="section-number">03 /</span> BEHIND THE PATTERNS
            </span>
            <h2>Explore the evidence.</h2>
          </div>
          <p>
            A closer look at the data, the methods, and the limits of what they
            can tell us.
          </p>
        </div>
        <div
          className="research-tabs"
          role="tablist"
          aria-label="Research topics"
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                buttons.current[i] = el
              }}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={i === selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span>0{i + 1}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div
          ref={ref}
          id={`panel-${tabs[selected].id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tabs[selected].id}`}
          tabIndex={0}
          className="research-panel"
        >
          {visible && (
            <Suspense
              fallback={
                <div className="workspace-loading" role="status">
                  Loading research…
                </div>
              }
            >
              <Content />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  )
}
