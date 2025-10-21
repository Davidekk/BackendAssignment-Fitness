import { Router } from 'express'

import { listPrograms } from '../controllers/program.controller'

const router = Router()

router.get('/', listPrograms)

export default router
