import type { IconName } from '@/ui/shared/widgets/components/icon'

export type EmptyCopy = {
  description: string
  icon: IconName
  title: string
}

const OPERATOR_COPY: EmptyCopy = {
  description: 'Este acompanhamento ainda não aparece em nenhuma porção.',
  icon: 'ice-cream-cone',
  title: 'Nenhuma porção vinculada',
}

const MANAGER_COPY: Record<
  'no-link' | 'no-portion-registered' | 'global-empty',
  EmptyCopy
> = {
  'no-link': {
    description:
      'Vincule porções para que este acompanhamento apareça nelas no PDV. Você pode escolher várias de uma vez.',
    icon: 'ice-cream-cone',
    title: 'Nenhuma porção vinculada',
  },
  'no-portion-registered': {
    description:
      'Cadastre um produto com a categoria Porção para vincular este acompanhamento.',
    icon: 'ice-cream-cone',
    title: 'Nenhuma porção cadastrada',
  },
  'global-empty': {
    description: 'Ele continua global: novas porções o receberão.',
    icon: 'globe',
    title: 'Nenhuma porção com este acompanhamento',
  },
}

const GLOBAL_OPERATOR_COPY: EmptyCopy = {
  description: 'Ele continua global: novas porções o receberão.',
  icon: 'globe',
  title: 'Nenhuma porção com este acompanhamento',
}

export function getEmptyCopy(
  canManage: boolean,
  variant: 'no-link' | 'no-portion-registered' | 'global-empty',
): EmptyCopy {
  if (canManage) return MANAGER_COPY[variant]
  return variant === 'global-empty' ? GLOBAL_OPERATOR_COPY : OPERATOR_COPY
}
