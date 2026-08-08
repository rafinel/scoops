import { SendInvitationEmailJob } from '@/communication/messaging/inngest/jobs/send-invitation-email-job'
import { inngest } from '@/shared/messaging/inngest/inngest-client'

const sendInvitationEmailJob = new SendInvitationEmailJob(inngest)

export const communicationInngestFunctions = [sendInvitationEmailJob.function]
