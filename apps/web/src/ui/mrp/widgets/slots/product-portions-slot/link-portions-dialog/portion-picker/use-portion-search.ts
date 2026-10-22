import { type KeyboardEvent, useState } from 'react'

export function usePortionSearch() {
  const [search, setSearch] = useState('')

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.preventDefault()
  }

  return { search, handleSearchChange, handleSearchKeyDown }
}
