import { ProductionPreview } from './production'
import { CompactPreview } from './compact'
import { ResultsPreview } from './results'
import { SalesPreview } from './sales'
import { PreviewShell } from './shell'

export type LandingShowcasePreviewProps = {
  kind: 'sales' | 'production' | 'results'
  activeIndex: number
  compact?: boolean
}

export const LandingShowcasePreview = ({
  kind,
  activeIndex,
  compact = false,
}: LandingShowcasePreviewProps) =>
  compact ? (
    <CompactPreview kind={kind} activeIndex={activeIndex} />
  ) : (
    <PreviewShell kind={kind}>
      {kind === 'sales' && <SalesPreview activeIndex={activeIndex} />}
      {kind === 'production' && <ProductionPreview activeIndex={activeIndex} />}
      {kind === 'results' && <ResultsPreview activeIndex={activeIndex} />}
    </PreviewShell>
  )
