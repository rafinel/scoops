import { Button, Heading, Text } from '@react-email/components'
import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'

export type OnboardingConfirmationEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
}

export const OnboardingConfirmationEmail = ({
  name,
  actionUrl,
  expiresAt,
}: OnboardingConfirmationEmailProps) => {
  return (
    <EmailLayout preview='Confirme seu cadastro no Scoops'>
      <Heading as='h1'>Confirme seu cadastro</Heading>
      <Text>Olá, {name}!</Text>
      <Text>
        Seu cadastro no Scoops está quase pronto. Confirme seu endereço de e-mail para
        continuar.
      </Text>
      <Button
        href={actionUrl}
        style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 18px' }}
      >
        Confirmar cadastro
      </Button>
      <Text>Este link expira em {expiresAt}.</Text>
    </EmailLayout>
  )
}

export const renderOnboardingConfirmationEmail = async (
  props: OnboardingConfirmationEmailProps,
) => {
  return {
    subject: 'Confirme seu cadastro no Scoops',
    html: await render(<OnboardingConfirmationEmail {...props} />),
  }
}
