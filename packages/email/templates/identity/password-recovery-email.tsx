import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'
import { IdentityActionEmailContent } from './identity-action-email-content.js'

export type PasswordRecoveryEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
}

export const PasswordRecoveryEmail = Object.assign(
  ({ name, actionUrl, expiresAt }: PasswordRecoveryEmailProps) => {
    return (
      <EmailLayout preview='Redefina sua senha no Scoops'>
        <IdentityActionEmailContent
          actionLabel='Redefinir senha'
          actionUrl={actionUrl}
          description='Recebemos uma solicitação para redefinir a senha da sua conta Scoops.'
          expiresAt={expiresAt}
          heading='Redefina sua senha'
          name={name}
        />
      </EmailLayout>
    )
  },
  {
    PreviewProps: {
      name: 'Maria Silva',
      actionUrl: 'https://example.com/password-reset',
      expiresAt: '10/09/2026 às 18:00',
    } satisfies PasswordRecoveryEmailProps,
  },
)

export const renderPasswordRecoveryEmail = async (props: PasswordRecoveryEmailProps) => {
  return {
    subject: 'Redefina sua senha no Scoops',
    html: await render(<PasswordRecoveryEmail {...props} />),
  }
}

export default PasswordRecoveryEmail
