const notes = [
  [
    '01',
    'Patterns are a starting point.',
    'Cluster membership describes similarity between flows. A cluster or an isolated point is not, on its own, evidence that traffic is malicious.',
  ],
  [
    '02',
    'A sample is a perspective.',
    'The explorer displays up to 3,000 flows from the 50,000-row mining sample. Attack-label mode changes the sample balance to make attack records easier to inspect.',
  ],
  [
    '03',
    'Historical, not live.',
    'CICIDS2017 is a labeled research capture from 2017. Findings on this dataset do not establish performance against current threats or a different network.',
  ],
  [
    '04',
    'Association is not causation.',
    'Apriori describes co-occurrence between discretized features and labels. Support, confidence, and lift do not establish a causal relationship.',
  ],
]
export default function Insights() {
  return (
    <div className="research-notes">
      <div className="section-label">Reading the results</div>
      <h3>Make room for uncertainty.</h3>
      <div className="notes-grid">
        {notes.map(([number, title, body]) => (
          <article key={number}>
            <span className="eyebrow">{number}</span>
            <h4>{title}</h4>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <a
        className="text-link"
        href="https://github.com/Rajchetan16/SENTINEL#limitations"
        target="_blank"
        rel="noreferrer"
      >
        Read the methodology on GitHub ↗
      </a>
    </div>
  )
}
