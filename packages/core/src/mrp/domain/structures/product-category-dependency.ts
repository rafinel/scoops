export type ProductCategoryDependency =
  | { kind: 'consuming-recipe'; productId: string; productName: string }
  | { kind: 'owned-recipe'; productId: string; productName: string }
  | {
      kind: 'portion-size'
      productId: string
      productName: string
      sizeCount: number
    }
  | {
      kind: 'portion-accompaniment'
      productId: string
      productName: string
      linkCount: number
    }
  | { kind: 'accompaniment-user'; productId: string; productName: string }
  | {
      kind: 'resale-configuration'
      productId: string
      productName: string
      configurationCount: number
    }
