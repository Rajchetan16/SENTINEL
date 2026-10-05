import SectionWrapper from '../layout/SectionWrapper'
import SectionHeader from '../ui/SectionHeader'
import ThreatExplorer3D from '../ThreatExplorer3D'

export default function Explorer3D() {
  return (
    <SectionWrapper id="explorer">
      <div className="container">
        <SectionHeader
          label="3D Behavioral Explorer"
          title="Interactive"
          titleAccent="Threat Visualization"
          description="Each point is a network flow from the CICIDS2017 dataset, positioned in 3D space by the features you choose. Switch modes to see K-Means clusters, DBSCAN density regions, or attack-type labels."
        />

        <ThreatExplorer3D />
      </div>
    </SectionWrapper>
  )
}
