import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '@/ui/identity/widgets/pages/landing-page'

export const Route = createFileRoute('/')({ component: LandingPage })
