import { LEGAL_PROVIDER } from '../legal-provider'

export const LegalResponsibleSection = () => (
  <section id='responsavel' className='scroll-mt-8'>
    <h2 className='text-xl leading-snug font-semibold'>Responsável e contato</h2>
    <div className='mt-4 space-y-3 text-base leading-8 text-muted-foreground'>
      {LEGAL_PROVIDER.legalName ? (
        <p>{LEGAL_PROVIDER.legalName}</p>
      ) : (
        <p>A razão social do responsável pelo Scoops está em confirmação.</p>
      )}
      {LEGAL_PROVIDER.registration && <p>{LEGAL_PROVIDER.registration}</p>}
      {LEGAL_PROVIDER.supportEmail && (
        <p>
          Atendimento:{' '}
          <a
            className='break-words text-primary underline underline-offset-4'
            href={`mailto:${LEGAL_PROVIDER.supportEmail}`}
          >
            {LEGAL_PROVIDER.supportEmail}
          </a>
        </p>
      )}
      {LEGAL_PROVIDER.privacyEmail ? (
        <p>
          Privacidade e solicitações sobre dados pessoais:{' '}
          <a
            className='break-words text-primary underline underline-offset-4'
            href={`mailto:${LEGAL_PROVIDER.privacyEmail}`}
          >
            {LEGAL_PROVIDER.privacyEmail}
          </a>
        </p>
      ) : (
        <p>O canal de privacidade será informado na versão final deste documento.</p>
      )}
    </div>
  </section>
)
