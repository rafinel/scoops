import { Button, Heading, Text } from '@react-email/components'
import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'

export type PasswordRecoveryEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
}

export const PasswordRecoveryEmail = ({
  name,
  actionUrl,
  expiresAt,
}: PasswordRecoveryEmailProps) => {
  return (
    <EmailLayout preview='Redefina sua senha no Scoops'>
      <Heading as='h1'>Redefina sua senha</Heading>
      <Text>Olá, {name}!</Text>
      <Text>Recebemos uma solicitação para redefinir a senha da sua conta Scoops.</Text>
      <Button
        href={actionUrl}
        style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 18px' }}
      >
        Redefinir senha
      </Button>
      <Text>Este link expira em {expiresAt}.</Text>
    </EmailLayout>
  )
}

export const renderPasswordRecoveryEmail = async (props: PasswordRecoveryEmailProps) => {
  return {
    subject: 'Redefina sua senha no Scoops',
    html: await render(<PasswordRecoveryEmail {...props} />),
  }
}
