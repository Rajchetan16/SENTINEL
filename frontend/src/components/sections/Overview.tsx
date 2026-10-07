import { ArrowIcon } from '../ui/Icons'

const methods = [
  {
    name: 'Find the structure.',
    algorithm: 'K-MEANS CLUSTERING',
    description:
      'Group similar flows into five behavioral clusters. See the larger patterns that individual records can’t reveal.',
    kind: 'clusters',
  },
  {
    name: 'Explore the edges.',
    algorithm: 'DBSCAN DENSITY ANALYSIS',
    description:
      'Follow regions of dense activity and examine the outliers. Unusual behavior is a starting point for investigation.',
    kind: 'outliers',
  },
  {
    name: 'Connect the signals.',
    algorithm: 'APRIORI ASSOCIATION RULES',
    description:
      'Explore which traffic characteristics occur together. Read patterns through support, confidence, and lift.',
    kind: 'rules',
  },
]
function MethodDiagram({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 300 140" className="method-diagram" aria-hidden="true">
      <path d="M0 115H300M30 0V140" stroke="currentColor" opacity=".1" />
      {kind === 'rules' ? (
        <>
          {[
            [70, 35, 150, 70],
            [70, 105, 150, 70],
            [150, 70, 240, 30],
            [150, 70, 240, 110],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              {...{ x1, y1, x2, y2 }}
              stroke="#a58ad9"
              strokeOpacity=".5"
            />
          ))}
          {[
            [70, 35],
            [70, 105],
            [150, 70],
            [240, 30],
            [240, 110],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={i === 2 ? 17 : 10}
                fill="#15111e"
                stroke="#9276be"
              />
              <circle cx={cx} cy={cy} r="3" fill="#d5baff" />
            </g>
          ))}
        </>
      ) : (
        Array.from({ length: 65 }, (_, i) => {
          const group = i % 3
          const a = i * 2.39996
          const r = 7 + (i % 20) * 1.3
          const outlier = kind === 'outliers' && i % 13 === 0
          const x = outlier
            ? 40 + ((i * 37) % 235)
            : [85, 170, 230][group] + Math.cos(a) * r
          const y = outlier
            ? 12 + ((i * 17) % 116)
            : [65, 96, 40][group] + Math.sin(a) * r * 0.75
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={outlier ? 3 : 2}
              fill={
                outlier ? '#e7b77b' : ['#ceb7ff', '#8e73d1', '#67537f'][group]
              }
              opacity={outlier ? 1 : 0.75}
            />
          )
        })
      )}
    </svg>
  )
}
export default function Overview() {
  return (
    <>
      <div className="dataset-strip" aria-label="Dataset at a glance">
        <div>
          <span className="eyebrow">GROUNDED IN REAL DATA</span>
          <strong>
            CICIDS2017<span> / Network flow research</span>
          </strong>
        </div>
        <dl>
          <div>
            <dt>Sampled flows</dt>
            <dd>50,000</dd>
          </div>
          <div>
            <dt>Numerical features</dt>
            <dd>78</dd>
          </div>
          <div>
            <dt>Mining techniques</dt>
            <dd>03</dd>
          </div>
        </dl>
      </div>
      <section id="overview" className="approach-section section-wrapper">
        <div className="container">
          <div className="section-intro">
            <div>
              <span className="eyebrow">
                <span className="section-number">01 /</span> THE APPROACH
              </span>
              <h2>
                Complex signals.
                <br />
                <span className="muted-heading">Clearer understanding.</span>
              </h2>
            </div>
            <p>
              Network traffic tells a story. SENTINEL brings three complementary
              perspectives together to help you explore it—one flow at a time.
            </p>
          </div>
          <div className="methods-grid">
            {methods.map((method, i) => (
              <article className="method" key={method.kind}>
                <div className="method-top">
                  <span>0{i + 1}</span>
                  <span>{method.algorithm}</span>
                </div>
                <MethodDiagram kind={method.kind} />
                <h3>{method.name}</h3>
                <p>{method.description}</p>
                <a
                  href={method.kind === 'rules' ? '#research' : '#explorer'}
                  className="method-link"
                >
                  {method.kind === 'rules'
                    ? 'Explore the research'
                    : 'Explore the data'}
                  <ArrowIcon />
                </a>
              </article>
            ))}
          </div>
          <div className="method-note">
            <span className="small-cross">+</span> Historical network data.
            Unsupervised methods. Patterns to investigate—not verdicts.
          </div>
        </div>
      </section>
    </>
  )
}
