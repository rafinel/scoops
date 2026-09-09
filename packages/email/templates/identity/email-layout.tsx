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

const bodyStyle = {
  backgroundColor: '#F7F7F8',
  color: '#111827',
  fontFamily: 'Manrope, Segoe UI, system-ui, sans-serif',
  margin: 0,
  padding: '32px 12px',
}

const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
}

const brandStyle = {
  color: '#6D28F5',
  fontSize: '22px',
  fontStyle: 'italic',
  fontWeight: 900,
  letterSpacing: '-0.5px',
  lineHeight: '28px',
  margin: 0,
}

const taglineStyle = {
  color: '#6B7280',
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '1.4px',
  lineHeight: '14px',
  margin: '4px 0 0',
  textTransform: 'uppercase' as const,
}

const footerStyle = {
  color: '#6B7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '20px 0 0',
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html lang='pt-BR' dir='ltr'>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section
            style={{
              borderBottom: '1px solid #F3F4F6',
              padding: '24px 32px 20px',
            }}
          >
            <Text style={brandStyle}>Scoops</Text>
            <Text style={taglineStyle}>Gestão para sorveterias</Text>
          </Section>

          <Section style={{ padding: '32px 32px 28px' }}>{children}</Section>

          <Section style={{ padding: '0 32px 28px' }}>
            <Hr style={{ borderColor: '#F3F4F6', margin: 0 }} />
            <Text style={footerStyle}>
              Esta é uma mensagem automática do Scoops. Se você não solicitou esta ação,
              pode ignorar este e-mail.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
