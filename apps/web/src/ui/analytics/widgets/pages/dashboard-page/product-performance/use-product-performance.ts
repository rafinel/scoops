import { useState } from 'react'
export const useProductPerformance = () => {
  const [mode, setMode] = useState<'net-sales' | 'quantity'>('net-sales')
  return { mode, setMode }
}
