export type LegalDocument = {
  title: string
  description: string
  route: 'termsOfUse' | 'privacyPolicy'
  version: string
  updatedAt: string
  sections: readonly {
    id: string
    title: string
    paragraphs: readonly string[]
    items?: readonly string[]
  }[]
}
