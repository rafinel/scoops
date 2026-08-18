import { z } from 'zod'

export const onboardingEmailCorrectionFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha cadastrada.'),
})
