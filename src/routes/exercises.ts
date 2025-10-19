import { Router } from 'express'

import { listExercises } from '../controllers/exercise'

const router = Router()

router.get('/', listExercises)

export default router
