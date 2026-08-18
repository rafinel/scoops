import { z } from 'zod'

export const onboardingRegistrationFormSchema = z
  .object({
    establishmentName: z.string().trim().min(1, 'Informe o nome da sorveteria.'),
    managerName: z.string().trim().min(1, 'Informe seu nome completo.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter entre 8 e 64 caracteres.')
      .max(64, 'A senha deve ter entre 8 e 64 caracteres.'),
    passwordConfirmation: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine(({ password, passwordConfirmation }) => password === passwordConfirmation, {
    message: 'As senhas precisam ser iguais.',
    path: ['passwordConfirmation'],
  })
