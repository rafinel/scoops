export const CLOSING_PHRASE = 'Sua próxima venda pode ser mais organizada.'

export const CLOSING_WORDS = CLOSING_PHRASE.split(' ')

export const CLOSING_STAR_GROUPS = ['far', 'middle', 'near'].map((id, groupIndex) => ({
  id,
  stars: Array.from({ length: 18 }, (_, starIndex) => {
    const index = groupIndex * 18 + starIndex
    return {
      id: index,
      left: `${(index * 37 + 11) % 101}%`,
      top: `${(index * 53 + 7) % 97}%`,
      size: index % 9 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
    }
  }),
}))
