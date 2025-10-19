import express from 'express'
import passport from '../config/passport'
import { authorizeRole } from '../middlewares/authorize'
import { USER_ROLE } from '../utils/enums'
import * as UserController from '../controllers/user'

const router = express.Router()

router.get(
  '/all',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.USER),
  UserController.getAllUsersBasic
)

router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.USER),
  UserController.getOwnProfile
)

router.post(
  '/track/:exerciseId',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.USER),
  UserController.trackCompletedExercise
)

router.get(
  '/completed',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.USER),
  UserController.getCompletedExercises
)

router.delete(
  '/completed/:id',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.USER),
  UserController.removeTrackedExercise
)

export default router
