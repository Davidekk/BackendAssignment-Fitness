import { Router } from 'express'

import { listExercises } from '../controllers/exerciseController'

const router = Router()

router.get('/', listExercises)

export default router
