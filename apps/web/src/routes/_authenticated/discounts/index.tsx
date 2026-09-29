import { createFileRoute } from '@tanstack/react-router'
import { comboListQuerySchema } from '@scoops/validation'

import { DiscountsPage } from '@/ui/pdv/widgets/pages/discounts-page'

export const Route = createFileRoute('/_authenticated/discounts/')({
  validateSearch: comboListQuerySchema,
  component: DiscountsPage,
})
