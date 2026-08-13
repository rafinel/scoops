import { useEffect } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import {
  hasPasswordRecoveryErrorRedirect,
  hasPasswordRecoveryRedirect,
} from '@/provision/auth/supabase/supabase-client'

export function useLandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (hasPasswordRecoveryErrorRedirect()) {
      void navigate({ to: ROUTES.resetPassword })
      return
    }

    if (hasPasswordRecoveryRedirect() && typeof window !== 'undefined') {
      void navigate({
        to: ROUTES.resetPassword,
        hash: window.location.hash,
      })
    }
  }, [navigate])
}
