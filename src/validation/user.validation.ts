import { z } from 'zod'
import { USER_ROLE } from '../utils/enums'
import { ageValueSchema } from './common'

export const exerciseIdParamSchema = z.object({
  exerciseId: z.string().regex(/^\d+$/, 'exerciseId must be a numeric string')
})

export const completedExerciseIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid completed exercise ID')
})

export const trackExerciseBodySchema = z
  .object({
    duration: z
      .any()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Invalid duration'
      })
      .transform((val) => Number(val))
  })
  .strict()

export const idParamSchema = z.object({
  id: z.string().trim().regex(/^\d+$/, { message: 'Invalid ID format' })
})

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'Name is required' }).optional(),

    surname: z
      .string()
      .trim()
      .min(1, { message: 'Surname is required' })
      .optional(),

    nickName: z
      .string()
      .trim()
      .min(1, { message: 'Nickname is required' })
      .optional(),

    age: ageValueSchema,

    role: z.enum(USER_ROLE).optional()
  })
  .strict()
