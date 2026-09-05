import { z } from 'zod'

export const browserEnvSchema = z
  .object({
    scoopsServerAppUrl: z.url(),
    scoopsServerApiPrefix: z.string().regex(/^$|^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/, {
      message: 'The server API prefix must be empty or a slash-prefixed path.',
    }),
  })
  .strict()
