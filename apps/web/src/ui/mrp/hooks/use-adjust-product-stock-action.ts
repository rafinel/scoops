import { useMutation } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import {
  createStockAdjustmentDispatcher,
  useStockAdjustmentMutationOptions,
} from './use-adjust-product-stock-action-telemetry'

export const useAdjustProductStockAction = (productId: string) => {
  const { mrpService } = useRestContext()
  const mutation = useMutation(useStockAdjustmentMutationOptions(productId, mrpService))
  return {
    error: mutation.error,
    isPending: mutation.isPending,
    adjustProductStock: createStockAdjustmentDispatcher(mutation.mutateAsync),
  }
}
