import { Router } from 'express'

import {
  register,
  login,
  refreshToken,
  logout
} from '../controllers/auth.controller'
import { loginSchema, registerSchema } from '../validation/auth.validation'
import { validate } from '../middlewares/validate'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refreshToken)
router.post('/logout', logout)

export default router
