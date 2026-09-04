import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

export type EmailLayoutProps = {
  preview: string
  children: ReactNode
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html lang='pt-BR' dir='ltr'>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f6f7f9', fontFamily: 'Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '32px auto',
            padding: '32px',
            maxWidth: '560px',
          }}
        >
          <Section>{children}</Section>
          <Hr />
          <Text style={{ color: '#667085', fontSize: '12px', lineHeight: '18px' }}>
            Esta é uma mensagem automática do Scoops. Se você não solicitou esta ação,
            pode ignorar este e-mail.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
