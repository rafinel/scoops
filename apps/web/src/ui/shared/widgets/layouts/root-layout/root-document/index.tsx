import type { PropsWithChildren } from 'react'

import { RootBody } from './root-body'
import { RootHead } from './root-head'

export type RootDocumentProps = PropsWithChildren

export const RootDocument = ({ children }: RootDocumentProps) => {
  return (
    <html lang='pt-BR'>
      <RootHead />
      <RootBody>{children}</RootBody>
    </html>
  )
}
