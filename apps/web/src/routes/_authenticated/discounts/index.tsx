import { createFileRoute } from '@tanstack/react-router'
import { comboListQuerySchema } from '@scoops/validation'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { DiscountsPage } from '@/ui/pdv/widgets/pages/discounts-page'

export const Route = createFileRoute('/_authenticated/discounts/')({
  beforeLoad: requireManagerMiddleware,
  validateSearch: comboListQuerySchema,
  component: DiscountsPage,
})
