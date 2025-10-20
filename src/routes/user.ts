import express from 'express'
import passport from '../config/passport'
import { authorizeRole } from '../middlewares/authorize'
import { USER_ROLE } from '../utils/enums'
import * as UserController from '../controllers/user'
import { validate } from '../middlewares/validate'
import {
  completedExerciseIdParamSchema,
  exerciseIdParamSchema,
  trackExerciseBodySchema
} from '../validation/user.validation'

const router = express.Router()

const auth = passport.authenticate('jwt', { session: false })
const user = authorizeRole(USER_ROLE.USER)

router.get('/all', auth, user, UserController.getAllUsersBasic)

router.get('/profile', auth, user, UserController.getOwnProfile)

router.post(
  '/track/:exerciseId',
  auth,
  user,
  validate(exerciseIdParamSchema, 'params'),
  validate(trackExerciseBodySchema),
  UserController.trackCompletedExercise
)

router.get('/completed', auth, user, UserController.getCompletedExercises)

router.delete(
  '/completed/:id',
  auth,
  user,
  validate(completedExerciseIdParamSchema, 'params'),
  UserController.removeTrackedExercise
)

export default router
