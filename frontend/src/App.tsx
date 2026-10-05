import Navbar from './components/layout/Navbar'
import Hero from './components/sections/Hero'
import Overview from './components/sections/Overview'
import DatasetIntelligence from './components/sections/DatasetIntelligence'
import Explorer3D from './components/sections/Explorer3D'
import ClusteringAnalysis from './components/sections/ClusteringAnalysis'
import AssociationRules from './components/sections/AssociationRules'
import Insights from './components/sections/Insights'

export default function App() {
  return (
    <>
      {/* Fixed background layers */}
      <div className="bg-mesh"  aria-hidden />
      <div className="bg-grid"  aria-hidden />

      {/* Navigation */}
      <Navbar />

      {/* Page sections */}
      <main>
        <Hero />
        <Overview />
        <DatasetIntelligence />
        <Explorer3D />
        <ClusteringAnalysis />
        <AssociationRules />
        <Insights />
      </main>
    </>
  )
}
