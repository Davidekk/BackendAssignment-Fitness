import { Router } from 'express'

import { listExercises } from '../controllers/exercise'
import { listExercisesQuerySchema } from '../validation/exercise.validation'
import { validate } from '../middlewares/validate'

const router = Router()

router.get('/', validate(listExercisesQuerySchema, 'query'), listExercises)

export default router
