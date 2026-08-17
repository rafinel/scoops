import { createFileRoute } from '@tanstack/react-router'
import { AccountPage } from '@/ui/identity/widgets/pages/account-page'

export const Route = createFileRoute('/_authenticated/account/')({
  component: AccountPage,
})
