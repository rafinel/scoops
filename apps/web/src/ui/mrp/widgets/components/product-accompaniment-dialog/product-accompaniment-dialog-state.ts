import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import type { ProductAccompanimentDialogScope } from './product-accompaniment-dialog-scope'
import type { useProductAccompanimentDerivedState } from './use-product-accompaniment-derived-state'

export type DialogContext = {
  item?: ProductAccompanimentDetails
  scope: ProductAccompanimentDialogScope
}

export function getScopeState(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
  context: DialogContext,
) {
  return {
    dialogCopy: getDialogCopy(context),
    hasGlobalSwitch: derived.hasGlobalSwitch,
    fields: {
      ...getScopeDialogFields(derived, context),
      hasGlobalSwitch: derived.hasGlobalSwitch,
    },
  }
}

function getScopeDialogFields(
  derived: ReturnType<typeof useProductAccompanimentDerivedState>,
  { item, scope }: DialogContext,
) {
  return {
    readOnlyProductName: item?.accompanimentProductName ?? getScopeProductName(scope),
    replacementNoticeWording:
      scope.kind === 'make-global'
        ? ('accompaniment-side' as const)
        : ('portion-side' as const),
    unit: item?.unit ?? derived.selectedProduct?.unit ?? 'un',
  }
}

function getScopeProductName(scope: ProductAccompanimentDialogScope) {
  return scope.kind === 'global' || scope.kind === 'make-global'
    ? scope.accompaniment.accompanimentProductName
    : undefined
}

export type ProductAccompanimentDialogCopy = {
  description: string
  submitLabel: string
  title: string
}

function getDialogCopy({ item, scope }: DialogContext): ProductAccompanimentDialogCopy {
  if (scope.kind === 'make-global') {
    return {
      description: `${scope.accompaniment.accompanimentProductName} passará a aparecer em todas as porções, incluindo as novas.`,
      submitLabel: 'Tornar global',
      title: 'Tornar acompanhamento global',
    }
  }
  if (scope.kind === 'global') {
    return {
      description: `Atualize como ${scope.accompaniment.accompanimentProductName} aparece em todas as porções no PDV.`,
      submitLabel: 'Salvar alterações',
      title: 'Editar Acompanhamento',
    }
  }
  if (scope.kind === 'portion-row' && item) {
    return {
      description: `Atualize como ${item.accompanimentProductName} aparece em ${scope.portionName} no PDV.`,
      submitLabel: 'Salvar alterações',
      title: 'Editar Acompanhamento',
    }
  }
  return item
    ? {
        description: 'Atualize como este item aparece no PDV.',
        submitLabel: 'Salvar alterações',
        title: 'Editar Acompanhamento',
      }
    : {
        description: 'Configure como este item aparece no PDV.',
        submitLabel: 'Vincular',
        title: 'Vincular Acompanhamento',
      }
}
