import { z } from 'zod'

export const EXERCISE_DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
} as const

export const listExercisesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      'Invalid page number'
    ),
  limit: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      'Invalid limit number'
    ),
  programID: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), 'Invalid programID'),
  search: z.string().optional()
})

export const exerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Exercise name is required')
    .max(200, 'Exercise name too long'),

  difficulty: z.enum(EXERCISE_DIFFICULTY),

  programID: z
    .any()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Program ID must be a positive number'
    )
    .transform((val) => Number(val))
})

export const exerciseProgramParamsSchema = z.object({
  programId: z.string().regex(/^\d+$/, 'programId must be a number string'),
  exerciseId: z.string().regex(/^\d+$/, 'exerciseId must be a number string')
})
