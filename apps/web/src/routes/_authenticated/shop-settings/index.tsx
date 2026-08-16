import { createFileRoute } from '@tanstack/react-router'
import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'
import { ShopSettingsPage } from '@/ui/identity/widgets/pages/shop-settings-page'

export const Route = createFileRoute('/_authenticated/shop-settings/')({
  beforeLoad: requireManagerMiddleware,
  component: ShopSettingsPage,
})
