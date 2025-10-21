import { z } from 'zod'

export const ageValueSchema = z
  .union([
    z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (value === '') return null

        const n = Number(value)
        if (!Number.isFinite(n) || n < 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'validation.common.invalidAge'
          })
          return z.NEVER
        }
        return n
      }),
    z.number().nonnegative({ message: 'validation.common.ageMustBePositive' }),
    z.null()
  ])
  .optional()
