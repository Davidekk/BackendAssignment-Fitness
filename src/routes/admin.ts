import express from 'express'
import passport from '../config/passport'
import { authorizeRole } from '../middlewares/authorize'
import { USER_ROLE } from '../utils/enums'
import {
  createExercise,
  updateExercise,
  deleteExercise,
  addExerciseToProgram,
  removeExerciseFromProgram,
  getAllUsers,
  getUserDetail,
  updateUser
} from '../controllers/admin'

const router = express.Router()

router.post(
  '/exercises',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  createExercise
)

router.put(
  '/exercises/:id',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  updateExercise
)

router.delete(
  '/exercises/:id',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  deleteExercise
)

router.post(
  '/programs/:programId/exercises/:exerciseId',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  addExerciseToProgram
)

router.delete(
  '/programs/:programId/exercises/:exerciseId',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  removeExerciseFromProgram
)

router.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  getAllUsers
)

router.get(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  getUserDetail
)

router.put(
  '/users/:id',
  passport.authenticate('jwt', { session: false }),
  authorizeRole(USER_ROLE.ADMIN),
  updateUser
)

export default router
