import { NextFunction, Request, Response } from 'express'
import { models } from '../db'
import { StatusCodes } from 'http-status-codes'
import { createLocalizedResponse } from '../services/localization.service'

const { User, Exercise, Program } = models

/**
 * Create a new exercise.
 * @route POST /admin/exercises
 * @returns 201 with created exercise, or 500 when creation fails.
 */
export const createExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const exercise = await Exercise.create(req.body)

    responder.success({
      status: StatusCodes.CREATED,
      messageKey: 'exercise.created',
      data: exercise,
      params: { name: exercise.name }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.create',
      data: {},
      logError: err
    })
  }
}

/**
 * Update an existing exercise.
 * @route PUT /admin/exercises/:id
 * @returns 200 with updated exercise, 404 if the exercise does not exist, or 500 on failure.
 */
export const updateExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const { id } = req.params

    const [updated] = await Exercise.update(req.body, { where: { id } })

    if (!updated)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'exercise.notFound',
        data: {}
      })

    const updatedExercise = await Exercise.findByPk(id)

    if (!updatedExercise) {
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'exercise.notFound',
        data: {}
      })
    }

    responder.success({
      messageKey: 'exercise.updated',
      data: updatedExercise,
      params: { name: (updatedExercise as any)?.name }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.update',
      data: {},
      logError: err
    })
  }
}

/**
 * Delete an exercise.
 * @route DELETE /admin/exercises/:id
 * @returns 200 with deleted exercise id, 404 if not found, or 500 on failure.
 */
export const deleteExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const { id } = req.params

    const exercise = await Exercise.findByPk(id)

    if (!exercise)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'exercise.notFound',
        data: {}
      })

    await exercise.destroy()

    responder.success({
      messageKey: 'exercise.deleted',
      data: { id: Number(id) },
      params: { name: (exercise as any)?.name }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.delete',
      data: {},
      logError: err
    })
  }
}

/**
 * Assign an exercise to a program.
 * @route POST /admin/programs/:programId/exercises/:exerciseId
 * @returns 200 with updated exercise, 404 if program or exercise is missing, or 500 on failure.
 */
export const addExerciseToProgram = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const { programId, exerciseId } = req.params
    const program = await Program.findByPk(programId)
    const exercise = await Exercise.findByPk(exerciseId)

    if (!program || !exercise)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'program.errors.programOrExerciseMissing',
        data: {}
      })

    await exercise.setProgram(program)

    const updatedExercise = await exercise.reload({
      attributes: ['id', 'name', 'difficulty', 'programID']
    })

    responder.success({
      messageKey: 'program.exerciseAdded',
      data: {
        programId: Number(programId),
        exercise: updatedExercise
      }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'program.errors.addExercise',
      data: {},
      logError: err
    })
  }
}

/**
 * Remove an exercise from a program.
 * @route DELETE /admin/programs/:programId/exercises/:exerciseId
 * @returns 200 with affected ids, 404 if program or exercise is missing, or 500 on failure.
 */
export const removeExerciseFromProgram = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const { programId, exerciseId } = req.params
    const program = await Program.findByPk(programId)
    const exercise = await Exercise.findByPk(exerciseId)

    if (!program || !exercise)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'program.errors.programOrExerciseMissing',
        data: {}
      })

    if (exercise.programID !== programId) {
      return responder.error({
        status: StatusCodes.BAD_REQUEST,
        messageKey: 'program.errors.exerciseNotInProgram',
        data: {}
      })
    }

    await exercise.setProgram(null)

    responder.success({
      messageKey: 'program.exerciseRemoved',
      data: { programId: Number(programId), exerciseId: Number(exerciseId) }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'program.errors.removeExercise',
      data: {},
      logError: err
    })
  }
}

/**
 * Retrieve all users (excluding passwords).
 * @route GET /admin/users
 * @returns 200 with users, or 500 when loading fails.
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    })
    responder.success({
      messageKey: 'user.list',
      data: users
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'user.errors.loadAll',
      data: {},
      logError: err
    })
  }
}

/**
 * Retrieve a single user by id.
 * @route GET /admin/users/:id
 * @returns 200 with user detail, 404 if not found, or 500 on failure.
 */
export const getUserDetail = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    })
    if (!user)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'user.notFound',
        data: {}
      })

    responder.success({
      messageKey: 'user.detail',
      data: user
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'user.errors.loadOne',
      data: {},
      logError: err
    })
  }
}

/**
 * Update user fields by id.
 * @route PUT /admin/users/:id
 * @returns 200 with updated user, 404 if not found, or 500 on failure.
 */
export const updateUser = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const { id } = req.params

    const [updated] = await User.update(req.body, { where: { id } })
    if (!updated)
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'user.notFound',
        data: {}
      })

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    })
    if (!updatedUser) {
      return responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'user.notFound',
        data: {}
      })
    }
    responder.success({
      messageKey: 'user.updated',
      data: updatedUser
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'user.errors.update',
      data: {},
      logError: err
    })
  }
}
