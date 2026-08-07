import type { Entity } from '#shared/domain/entities/entity.ts'
import type { FiscalDocumentStatus } from '#billing/domain/structures/fiscal-document-status.ts'

export type FiscalDocument = Entity & {
  establishmentId: string
  chargeId: string
  providerDocumentId?: string
  number?: string
  status: FiscalDocumentStatus
  issuedAt?: Date
  url?: string
  createdAt: Date
  updatedAt: Date
}

export type FiscalDocumentCreate = Omit<FiscalDocument, 'id' | 'createdAt' | 'updatedAt'>

export type FiscalDocumentUpdate = Partial<
  Pick<FiscalDocument, 'providerDocumentId' | 'number' | 'status' | 'issuedAt' | 'url'>
>
