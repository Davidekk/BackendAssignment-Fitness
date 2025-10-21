import { z } from 'zod'
import { USER_ROLE } from '../utils/enums'
import { ageValueSchema } from './common'

export const exerciseIdParamSchema = z.object({
  exerciseId: z
    .string({
      error: 'validation.common.exerciseIdNumericString'
    })
    .regex(/^\d+$/, 'validation.common.exerciseIdNumericString')
})

export const completedExerciseIdParamSchema = z.object({
  id: z
    .string({
      error: 'validation.common.completedExerciseIdInvalid'
    })
    .regex(/^\d+$/, 'validation.common.completedExerciseIdInvalid')
})

export const trackExerciseBodySchema = z
  .object({
    duration: z
      .any()
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'validation.common.invalidDuration'
      })
      .transform((val) => Number(val))
  })
  .strict()

export const idParamSchema = z.object({
  id: z
    .string({
      error: 'validation.common.invalidIdFormat'
    })
    .trim()
    .regex(/^\d+$/, { message: 'validation.common.invalidIdFormat' })
})

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'validation.common.nameRequired' })
      .optional(),

    surname: z
      .string()
      .trim()
      .min(1, { message: 'validation.common.surnameRequired' })
      .optional(),

    nickName: z
      .string()
      .trim()
      .min(1, { message: 'validation.common.nicknameRequired' })
      .optional(),

    age: ageValueSchema,

    role: z.enum(USER_ROLE).optional()
  })
  .strict()
