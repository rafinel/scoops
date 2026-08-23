import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { accompanimentTypesSearchSchema } from '@scoops/validation'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { AccompanimentTypesPage } from '@/ui/mrp/widgets/pages/accompaniment-types-page'

export const Route = createFileRoute('/_authenticated/accompaniment-types/')({
  beforeLoad: requireManagerMiddleware,
  validateSearch: accompanimentTypesSearchSchema,
  component: AccompanimentTypesRoute,
})

function AccompanimentTypesRoute() {
  const { page } = useSearch({ from: '/_authenticated/accompaniment-types/' })
  const navigate = useNavigate({ from: '/accompaniment-types/' })
  return (
    <AccompanimentTypesPage
      page={page}
      onPageChange={(nextPage) => void navigate({ search: { page: nextPage } })}
    />
  )
}
