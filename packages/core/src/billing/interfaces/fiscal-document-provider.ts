import type { FiscalDocument } from '#billing/domain/entities/fiscal-document.ts'
import type { FiscalDocumentInput } from '#billing/domain/structures/fiscal-document-input.ts'

export interface FiscalDocumentProvider {
  issue(input: FiscalDocumentInput): Promise<FiscalDocument>
  cancel(document: FiscalDocument): Promise<FiscalDocument>
}
