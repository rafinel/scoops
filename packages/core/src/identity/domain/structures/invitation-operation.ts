export const InvitationOperation = {
  CorrectEmail: 'correct-email',
  Resend: 'resend',
  Cancel: 'cancel',
  Accept: 'accept',
  Expire: 'expire',
} as const

export type InvitationOperation =
  (typeof InvitationOperation)[keyof typeof InvitationOperation]
