import { z } from 'zod'
import { USER_ROLE } from '../utils/enums'
import { ageValueSchema } from './common'

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),

  surname: z.string().min(1, 'Surname is required'),

  nickName: z.string().min(1, 'Nickname is required'),

  email: z.email('Invalid email format'),

  password: z.string().min(6, 'Password must be at least 6 characters'),

  role: z.enum(USER_ROLE).optional(),

  age: ageValueSchema
})

export const loginSchema = z.object({
  email: z.email(),

  password: z.string().min(1, 'Password is required')
})
