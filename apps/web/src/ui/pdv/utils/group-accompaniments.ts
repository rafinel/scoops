export function groupAccompaniments<T extends { readonly type: string }>(
  accompaniments: readonly T[],
): { type: string; accompaniments: T[] }[] {
  const groups = new Map<string, T[]>()

  for (const accompaniment of accompaniments) {
    const group = groups.get(accompaniment.type)
    if (group) group.push(accompaniment)
    else groups.set(accompaniment.type, [accompaniment])
  }

  return Array.from(groups, ([type, items]) => ({ type, accompaniments: items }))
}
