import { z } from 'zod'
import { USER_ROLE } from '../utils/enums'
import { ageValueSchema } from './common'

export const registerSchema = z.object({
  name: z
    .string({
      error: 'validation.common.nameRequired'
    })
    .min(1, 'validation.common.nameRequired'),

  surname: z
    .string({
      error: 'validation.common.surnameRequired'
    })
    .min(1, 'validation.common.surnameRequired'),

  nickName: z
    .string({
      error: 'validation.common.nicknameRequired'
    })
    .min(1, 'validation.common.nicknameRequired'),

  email: z
    .string({
      error: 'validation.common.emailRequired'
    })
    .email('validation.common.invalidEmailFormat'),

  password: z
    .string({
      error: 'validation.common.passwordRequired'
    })
    .min(6, 'validation.common.passwordMin'),

  role: z.enum(USER_ROLE).optional(),

  age: ageValueSchema
})

export const loginSchema = z.object({
  email: z
    .string({
      error: 'validation.common.emailRequired'
    })
    .email('validation.common.invalidEmailFormat'),

  password: z
    .string({
      error: 'validation.common.passwordRequired'
    })
    .min(1, 'validation.common.passwordRequired')
})
