import { Router } from 'express'

import { register, login, refreshToken } from '../controllers/auth'
import { loginSchema, registerSchema } from '../validation/auth.validation'
import { validate } from '../middlewares/validate'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refreshToken)

export default router
