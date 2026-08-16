import {
  InvitationOperation,
  type InvitationOperation as InvitationOperationValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const invitationOperationModel = pgEnum(
  'invitation_operation',
  Object.values(InvitationOperation) as [
    InvitationOperationValue,
    ...InvitationOperationValue[],
  ],
)
