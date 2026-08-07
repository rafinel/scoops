import type {
  FiscalDocument,
  FiscalDocumentCreate,
  FiscalDocumentUpdate,
} from '#billing/domain/entities/fiscal-document.ts'

export interface FiscalDocumentsRepository {
  add(input: FiscalDocumentCreate): Promise<FiscalDocument>
  findByChargeId(chargeId: string): Promise<FiscalDocument | undefined>
  replace(documentId: string, changes: FiscalDocumentUpdate): Promise<FiscalDocument>
}
