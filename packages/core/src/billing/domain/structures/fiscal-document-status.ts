export const FiscalDocumentStatus = {
  Pending: 'pending',
  Issued: 'issued',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const

export type FiscalDocumentStatus =
  (typeof FiscalDocumentStatus)[keyof typeof FiscalDocumentStatus]
