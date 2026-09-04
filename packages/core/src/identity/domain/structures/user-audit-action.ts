export const UserAuditAction = {
  UserRegistered: 'user-registered',
  InvitationResent: 'invitation-resent',
  InvitationCancelled: 'invitation-cancelled',
  UserActivated: 'user-activated',
  ProfileChanged: 'profile-changed',
  UserInactivated: 'user-inactivated',
  UserReactivated: 'user-reactivated',
  UserNameChanged: 'user-name-changed',
  PasswordRecoveryInitiated: 'password-recovery-initiated',
} as const

export type UserAuditAction = (typeof UserAuditAction)[keyof typeof UserAuditAction]
