import { useState } from 'react'
export const useCostCoverageDialog = () => {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
