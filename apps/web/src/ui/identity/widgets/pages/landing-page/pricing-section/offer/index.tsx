import { Icon } from '@/ui/shared/widgets/components/icon'

const INCLUDED_LIMITS = [
  'Usuários ilimitados',
  'Produtos ilimitados',
  'Pedidos ilimitados',
  'Movimentações ilimitadas',
]

export const LandingPricingOffer = () => (
  <div className='landing-pricing-offer'>
    <h3>Scoops Completo</h3>
    <p className='landing-pricing-price'>
      <span>R$ 79,90</span>
      <span className='landing-pricing-period'>/mês</span>
    </p>
    <p className='landing-pricing-tax'>Impostos inclusos</p>
    <div className='landing-pricing-included'>
      <p>Todos os recursos em um único plano</p>
      <ul>
        {INCLUDED_LIMITS.map((limit) => (
          <li key={limit}>
            <Icon name='check' />
            <span>{limit}</span>
          </li>
        ))}
      </ul>
    </div>
    <p className='landing-pricing-trial'>14 dias grátis, sem cartão de crédito</p>
  </div>
)
