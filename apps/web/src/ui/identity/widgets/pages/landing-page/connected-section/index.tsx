import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'
import { LandingConnectedStep } from './step'
import { useLandingConnectedSection } from './use-landing-connected-section'
import './connected-section.css'

const CONNECTED_STEPS = [
  {
    title: 'Organize',
    icon: 'package',
    description: 'Cadastre produtos, ingredientes e receitas.',
  },
  {
    title: 'Produza',
    icon: 'chef-hat',
    description: 'Veja quanto pode produzir e registre o consumo.',
  },
  {
    title: 'Venda',
    icon: 'shopping-bag',
    description: 'Monte pedidos e atualize o estoque na confirmação.',
  },
  {
    title: 'Acompanhe',
    icon: 'chart-no-axes-combined',
    description: 'Entenda as vendas e o que precisa de atenção.',
  },
] satisfies { title: string; icon: IconName; description: string }[]

export const LandingConnectedSection = () => {
  const { scope } = useLandingConnectedSection()

  return (
    <section
      ref={scope}
      aria-labelledby='landing-connected-title'
      className='landing-connected'
    >
      <div className='landing-connected-content'>
        <div className='landing-connected-heading'>
          <h2 data-connected-enter='0' id='landing-connected-title'>
            <span>Do ingrediente </span>
            <span className='landing-connected-title-accent'>ao último pedido.</span>
          </h2>
          <p data-connected-enter='1'>
            Cada etapa conversa com a próxima. Você acompanha a operação sem perder o fio.
          </p>
        </div>
        <ol aria-label='Etapas da operação conectada' className='landing-connected-steps'>
          {CONNECTED_STEPS.map((step, index) => (
            <LandingConnectedStep
              key={step.title}
              title={step.title}
              icon={step.icon}
              description={step.description}
              position={index}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
