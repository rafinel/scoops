import { Button, Heading, Section, Text } from '@react-email/components'

type IdentityActionEmailContentProps = {
  actionLabel: string
  actionUrl: string
  description: string
  expiresAt: string
  heading: string
  name: string
}

const headingStyle = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  lineHeight: '32px',
  margin: '0 0 20px',
}

const greetingStyle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '24px',
  margin: '0 0 8px',
}

const bodyStyle = {
  color: '#6B7280',
  fontSize: '15px',
  lineHeight: '25px',
  margin: 0,
}

const buttonStyle = {
  backgroundColor: '#6D28F5',
  borderRadius: '10px',
  boxShadow: '0 8px 20px rgba(109, 40, 245, 0.25)',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: '20px',
  padding: '12px 20px',
  textDecoration: 'none',
}

const expirySectionStyle = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  margin: '24px 0 0',
  padding: '12px 16px',
}

const expiryTextStyle = {
  color: '#6B7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: 0,
}

export const IdentityActionEmailContent = ({
  actionLabel,
  actionUrl,
  description,
  expiresAt,
  heading,
  name,
}: IdentityActionEmailContentProps) => {
  return (
    <>
      <Heading as='h1' style={headingStyle}>
        {heading}
      </Heading>
      <Text style={greetingStyle}>Olá, {name}!</Text>
      <Text style={bodyStyle}>{description}</Text>
      <Section style={{ margin: '24px 0 0' }}>
        <Button href={actionUrl} style={buttonStyle}>
          {actionLabel}
        </Button>
      </Section>
      <Section style={expirySectionStyle}>
        <Text style={expiryTextStyle}>Este link expira em {expiresAt}.</Text>
      </Section>
    </>
  )
}
