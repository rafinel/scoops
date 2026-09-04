export type EmailMessage = {
  idempotencyKey: string
  to: string
  subject: string
  html: string
}
