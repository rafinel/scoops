export const AccompanimentRemovalScope = {
  Portion: 'portion',
  All: 'all',
} as const

export type AccompanimentRemovalScope =
  (typeof AccompanimentRemovalScope)[keyof typeof AccompanimentRemovalScope]
