import { render } from '@react-email/render'

import { EmailLayout } from './email-layout.js'
import { IdentityActionEmailContent } from './identity-action-email-content.js'

export type OnboardingConfirmationEmailProps = {
  name: string
  actionUrl: string
  expiresAt: string
}

export const OnboardingConfirmationEmail = Object.assign(
  ({ name, actionUrl, expiresAt }: OnboardingConfirmationEmailProps) => {
    return (
      <EmailLayout preview='Confirme seu cadastro no Scoops'>
        <IdentityActionEmailContent
          actionLabel='Confirmar cadastro'
          actionUrl={actionUrl}
          description='Seu cadastro no Scoops está quase pronto. Confirme seu endereço de e-mail para continuar.'
          expiresAt={expiresAt}
          heading='Confirme seu cadastro'
          name={name}
        />
      </EmailLayout>
    )
  },
  {
    PreviewProps: {
      name: 'Maria Silva',
      actionUrl: 'https://example.com/onboarding/confirm',
      expiresAt: '10/09/2026 às 18:00',
    } satisfies OnboardingConfirmationEmailProps,
  },
)

export const renderOnboardingConfirmationEmail = async (
  props: OnboardingConfirmationEmailProps,
) => {
  return {
    subject: 'Confirme seu cadastro no Scoops',
    html: await render(<OnboardingConfirmationEmail {...props} />),
  }
}

export default OnboardingConfirmationEmail
