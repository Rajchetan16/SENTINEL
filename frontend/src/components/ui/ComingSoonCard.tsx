import { motion } from 'framer-motion'

interface ComingSoonCardProps {
  icon: string
  title: string
  description: string
  tags?: string[]
}

export default function ComingSoonCard({ icon, title, description, tags = [] }: ComingSoonCardProps) {
  return (
    <motion.div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '1rem',
        minHeight: '220px',
      }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{description}</p>
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
          {tags.map(t => (
            <span key={t} className="badge badge-cyan">{t}</span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
