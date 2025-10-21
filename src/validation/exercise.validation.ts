import { z } from 'zod'

export const EXERCISE_DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
} as const

const difficultyValues = [
  EXERCISE_DIFFICULTY.EASY,
  EXERCISE_DIFFICULTY.MEDIUM,
  EXERCISE_DIFFICULTY.HARD
] as const

const baseDifficulty = z.enum(difficultyValues, {
  error: () => ({ message: 'validation.common.invalidDifficulty' })
})

const difficultyRequired = baseDifficulty
  .or(z.undefined())
  .refine((v): v is (typeof difficultyValues)[number] => v !== undefined, {
    message: 'validation.common.difficultyRequired'
  })

export const listExercisesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      'validation.common.invalidPageNumber'
    ),
  limit: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      'validation.common.invalidLimitNumber'
    ),
  programID: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(Number(v)),
      'validation.common.invalidProgramId'
    ),
  search: z.string().optional()
})

export const exerciseSchema = z.object({
  name: z
    .string({
      error: 'validation.common.exerciseNameRequired'
    })
    .trim()
    .min(1, 'validation.common.exerciseNameRequired')
    .max(200, 'validation.common.exerciseNameTooLong'),

  difficulty: difficultyRequired,

  programID: z
    .any()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'validation.common.programIdPositive'
    )
    .transform((val) => Number(val))
})

export const exerciseProgramParamsSchema = z.object({
  programId: z
    .string({
      error: 'validation.common.programIdNumericString'
    })
    .regex(/^\d+$/, 'validation.common.programIdNumericString'),
  exerciseId: z
    .string({
      error: 'validation.common.exerciseIdNumericString'
    })
    .regex(/^\d+$/, 'validation.common.exerciseIdNumericString')
})
