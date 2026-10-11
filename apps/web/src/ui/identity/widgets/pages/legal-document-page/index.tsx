import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { LegalResponsibleSection } from './responsible-section'
import type { LegalDocument } from './types/legal-document'

export type LegalDocumentPageProps = {
  document: LegalDocument
}

export const LegalDocumentPage = ({ document }: LegalDocumentPageProps) => (
  <div className='min-h-screen bg-card font-sans text-foreground'>
    <a
      href='#documento'
      className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:rounded-md focus:bg-card focus:p-4 focus:text-primary'
    >
      Ir para o documento
    </a>
    <header className='border-b border-border'>
      <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-6 md:px-8'>
        <Anchor
          route='root'
          aria-label='Scoops — início'
          className='flex items-center gap-3 text-xl font-extrabold text-primary italic'
        >
          <Icon name='ice-cream-cone' className='size-6' />
          <span>Scoops</span>
        </Anchor>
        <nav aria-label='Documentos legais' className='flex flex-wrap gap-5 text-sm'>
          <Anchor
            route='termsOfUse'
            aria-current={document.route === 'termsOfUse' ? 'page' : undefined}
            className='text-muted-foreground hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary'
          >
            Termos de uso
          </Anchor>
          <Anchor
            route='privacyPolicy'
            aria-current={document.route === 'privacyPolicy' ? 'page' : undefined}
            className='text-muted-foreground hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary'
          >
            Privacidade
          </Anchor>
        </nav>
      </div>
    </header>
    <div className='mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-16'>
      <BackLink route='root' className='mb-8 px-0'>
        Voltar ao início
      </BackLink>
      <div className='max-w-3xl'>
        <h1 className='text-4xl leading-tight font-medium tracking-tight md:text-5xl'>
          {document.title}
        </h1>
        <p className='mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground'>
          {document.description}
        </p>
        <p className='mt-5 text-sm leading-relaxed text-muted-foreground'>
          Versão {document.version} · Atualizado em {document.updatedAt}
        </p>
        <aside
          aria-label='Situação do documento'
          className='mt-8 rounded-lg border border-border bg-muted p-5 text-sm leading-relaxed'
        >
          <p className='font-semibold'>Minuta para revisão</p>
          <p className='mt-2 text-muted-foreground'>
            Este documento ainda não é a versão final. A razão social do responsável e as
            informações sobre fornecedores, transferências internacionais e conservação de
            dados precisam ser confirmados antes da publicação definitiva.
          </p>
        </aside>
      </div>
      <div className='mt-12 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16'>
        <nav aria-label='Nesta página' className='lg:sticky lg:top-8 lg:self-start'>
          <h2 className='text-sm font-semibold'>Nesta página</h2>
          <ol className='mt-4 space-y-3 text-sm leading-relaxed'>
            <li>
              <a className='text-muted-foreground hover:text-primary' href='#responsavel'>
                Responsável e contato
              </a>
            </li>
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className='text-muted-foreground hover:text-primary'
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <main id='documento' tabIndex={-1} className='min-w-0 max-w-[70ch]'>
          <article aria-label={document.title} className='space-y-10'>
            <LegalResponsibleSection />
            {document.sections.map((section) => (
              <section key={section.id} id={section.id} className='scroll-mt-8'>
                <h2 className='text-xl leading-snug font-semibold'>{section.title}</h2>
                <div className='mt-4 space-y-4 text-base leading-8 text-muted-foreground'>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items && (
                    <ul className='list-disc space-y-3 pl-5'>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </article>
          <footer className='mt-12 border-t border-border pt-6 text-sm leading-relaxed'>
            {document.route === 'termsOfUse' ? (
              <Anchor
                route='privacyPolicy'
                className='text-primary underline underline-offset-4'
              >
                Leia também a Política de Privacidade
              </Anchor>
            ) : (
              <Anchor
                route='termsOfUse'
                className='text-primary underline underline-offset-4'
              >
                Leia também os Termos de Uso
              </Anchor>
            )}
          </footer>
        </main>
      </div>
    </div>
  </div>
)
