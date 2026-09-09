import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'
import { IdentityActionEmailContent } from './identity-action-email-content.js'

export type UserInvitationEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
  operation: 'initial' | 'corrected' | 'resent'
}

export const UserInvitationEmail = Object.assign(
  ({ name, actionUrl, expiresAt, operation }: UserInvitationEmailProps) => {
    const isCorrection = operation === 'corrected'
    const preview = isCorrection
      ? 'Seu convite do Scoops foi atualizado'
      : 'Você recebeu um convite para o Scoops'

    return (
      <EmailLayout preview={preview}>
        <IdentityActionEmailContent
          actionLabel='Aceitar convite'
          actionUrl={actionUrl}
          description='Você recebeu um convite para acessar o Scoops. Use o botão abaixo para criar sua senha e aceitar o convite.'
          expiresAt={expiresAt}
          heading={isCorrection ? 'Seu convite foi atualizado' : 'Você foi convidado'}
          name={name}
        />
      </EmailLayout>
    )
  },
  {
    PreviewProps: {
      name: 'Maria Silva',
      actionUrl: 'https://example.com/invitation/accept',
      expiresAt: '10/09/2026 às 18:00',
      operation: 'initial',
    } satisfies UserInvitationEmailProps,
  },
)

export const renderUserInvitationEmail = async (props: UserInvitationEmailProps) => {
  return {
    subject:
      props.operation === 'corrected'
        ? 'Seu convite do Scoops foi atualizado'
        : 'Convite para acessar o Scoops',
    html: await render(<UserInvitationEmail {...props} />),
  }
}

export default UserInvitationEmail
