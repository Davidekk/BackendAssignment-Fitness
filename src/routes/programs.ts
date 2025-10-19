import { Router } from 'express'

import { listPrograms } from '../controllers/program'

const router = Router()

router.get('/', listPrograms)

export default router
