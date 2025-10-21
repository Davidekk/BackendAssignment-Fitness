import express from 'express'
import passport from '../config/passport'
import { authorizeRole } from '../middlewares/authorize'
import { USER_ROLE } from '../utils/enums'
import * as AdminController from '../controllers/admin.controller'
import { validate } from '../middlewares/validate'
import { idParamSchema, updateUserSchema } from '../validation/user.validation'
import {
  exerciseSchema,
  exerciseProgramParamsSchema
} from '../validation/exercise.validation'

const router = express.Router()

const auth = passport.authenticate('jwt', { session: false })
const admin = authorizeRole(USER_ROLE.ADMIN)

router.post(
  '/exercises',
  auth,
  admin,
  validate(exerciseSchema),
  AdminController.createExercise
)

router.put(
  '/exercises/:id',
  auth,
  admin,
  validate(idParamSchema, 'params'),
  validate(exerciseSchema),
  AdminController.updateExercise
)

router.delete(
  '/exercises/:id',
  auth,
  admin,
  validate(idParamSchema, 'params'),
  AdminController.deleteExercise
)

router.post(
  '/programs/:programId/exercises/:exerciseId',
  auth,
  admin,
  validate(exerciseProgramParamsSchema, 'params'),
  AdminController.addExerciseToProgram
)

router.delete(
  '/programs/:programId/exercises/:exerciseId',
  auth,
  admin,
  validate(exerciseProgramParamsSchema, 'params'),
  AdminController.removeExerciseFromProgram
)

router.get('/users', auth, admin, AdminController.getAllUsers)

router.get(
  '/users/:id',
  auth,
  admin,
  validate(idParamSchema, 'params'),
  AdminController.getUserDetail
)

router.put(
  '/users/:id',
  auth,
  admin,
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  AdminController.updateUser
)

export default router
