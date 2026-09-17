import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { establishmentSettingsQueryKey } from './use-establishment-settings-query'
export const useChangeEstablishmentTimezoneAction = () => {
  const { identityService } = useRestContext()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (timeZone: EstablishmentTimezone) =>
      identityService.changeEstablishmentTimezone(timeZone),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: establishmentSettingsQueryKey }),
  })
}
