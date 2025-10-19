import { Router } from 'express'

import { listPrograms } from '../controllers/programController'

const router = Router()

router.get('/', listPrograms)

export default router
