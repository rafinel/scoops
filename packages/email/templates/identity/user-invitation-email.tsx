import { Button, Heading, Text } from '@react-email/components'
import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'

export type UserInvitationEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
  operation: 'initial' | 'corrected' | 'resent'
}

export const UserInvitationEmail = ({
  name,
  actionUrl,
  expiresAt,
  operation,
}: UserInvitationEmailProps) => {
  const isCorrection = operation === 'corrected'
  const preview = isCorrection
    ? 'Seu convite do Scoops foi atualizado'
    : 'Você recebeu um convite para o Scoops'

  return (
    <EmailLayout preview={preview}>
      <Heading as='h1'>
        {isCorrection ? 'Seu convite foi atualizado' : 'Você foi convidado'}
      </Heading>
      <Text>Olá, {name}!</Text>
      <Text>
        Você recebeu um convite para acessar o Scoops. Use o botão abaixo para criar sua
        senha e aceitar o convite.
      </Text>
      <Button
        href={actionUrl}
        style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 18px' }}
      >
        Aceitar convite
      </Button>
      <Text>Este link expira em {expiresAt}.</Text>
    </EmailLayout>
  )
}

export const renderUserInvitationEmail = async (props: UserInvitationEmailProps) => {
  return {
    subject:
      props.operation === 'corrected'
        ? 'Seu convite do Scoops foi atualizado'
        : 'Convite para acessar o Scoops',
    html: await render(<UserInvitationEmail {...props} />),
  }
}
