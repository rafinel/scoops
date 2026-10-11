import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import './footer.css'

export const LandingFooter = () => (
  <footer className='landing-footer'>
    <div className='landing-footer-brand'>
      <Anchor route='root' aria-label='Scoops — início' className='landing-footer-logo'>
        <Icon name='ice-cream-cone' className='size-6' />
        <span>Scoops</span>
      </Anchor>
      <p>Do estoque à venda, sua sorveteria conectada.</p>
    </div>
    <nav aria-label='Navegação do rodapé' className='landing-footer-links'>
      <a href='#landing-pricing-title'>Preço</a>
      <Anchor route='login'>Entrar</Anchor>
      <Anchor route='termsOfUse'>Termos de uso</Anchor>
      <Anchor route='privacyPolicy'>Privacidade</Anchor>
    </nav>
  </footer>
)
