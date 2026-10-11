import type { IconName } from '@/ui/shared/widgets/components/icon'

export type TeamProfile = {
  id: 'manager' | 'operator' | 'history'
  name: string
  title: string
  icon: IconName
  tag: string
  description: string
}

export const TEAM_PROFILES: TeamProfile[] = [
  {
    id: 'manager',
    name: 'Gerente',
    title: 'Gerente',
    icon: 'shield-check',
    tag: 'Gestão',
    description:
      'Gerencia a equipe, os produtos, a produção e as configurações da sorveteria.',
  },
  {
    id: 'operator',
    name: 'Operador',
    title: 'Operador',
    icon: 'shopping-bag',
    tag: 'Balcão',
    description:
      'Registra vendas, consulta pedidos e visualiza produtos, canais e descontos.',
  },
  {
    id: 'history',
    name: 'Histórico',
    title: 'Histórico de alterações da equipe',
    icon: 'clock',
    tag: 'Acessos',
    description: 'O gerente consulta quem alterou o acesso, o que mudou e quando.',
  },
]
