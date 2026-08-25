export type ProductRemovalImpact = {
  productName: string
  removable: {
    brands: number
    balances: number
    ownedRecipe: number
    sizes: number
    resaleConfigurations: number
    ownedAccompanimentLinks: number
    consumingRecipeLinks: number
    inverseAccompanimentLinks: number
  }
  retainedHistory: {
    stockTransactions: number
    productions: number
    orders: number
  }
}
