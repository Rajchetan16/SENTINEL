interface SectionHeaderProps {
  label: string
  title: string
  titleAccent?: string
  description?: string
}
export default function SectionHeader({
  label,
  title,
  titleAccent,
  description,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-label">{label}</div>
      <h2>
        {title}{' '}
        {titleAccent && <span className="muted-heading">{titleAccent}</span>}
      </h2>
      {description && <p>{description}</p>}
    </div>
  )
}
