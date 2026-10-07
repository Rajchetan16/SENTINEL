import { MotionConfig } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import Overview from './components/sections/Overview'
import Explorer3D from './components/sections/Explorer3D'
import Research from './components/sections/Research'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a href="#explorer" className="skip-link">
        Skip to data explorer
      </a>
      <Navbar />
      <main>
        <Hero />
        <Overview />
        <Explorer3D />
        <Research />
      </main>
      <Footer />
    </MotionConfig>
  )
}
