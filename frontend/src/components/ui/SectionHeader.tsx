interface SectionHeaderProps {
  label: string
  title: string
  titleAccent?: string
  description?: string
}

export default function SectionHeader({ label, title, titleAccent, description }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <div className="section-label">{label}</div>
      <h2>
        {title}{' '}
        {titleAccent && <span className="gradient-text">{titleAccent}</span>}
      </h2>
      {description && (
        <p style={{ marginTop: '1rem', maxWidth: '640px' }}>{description}</p>
      )}
    </div>
  )
}
