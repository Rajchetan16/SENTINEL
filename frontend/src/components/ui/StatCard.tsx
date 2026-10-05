import { motion } from 'framer-motion'

interface StatCardProps {
  value: string
  label: string
  accent?: string
  delay?: number
}

export default function StatCard({ value, label, accent = 'var(--accent-cyan)', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{ textAlign: 'center', padding: '1.5rem 1rem' }}
    >
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  )
}
