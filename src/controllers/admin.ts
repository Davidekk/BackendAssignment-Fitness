import { NextFunction, Request, Response } from 'express'
import { models } from '../db'
import { StatusCodes } from 'http-status-codes'
import { createLocalizedResponse } from '../services/localization'

const { User, Exercise, Program } = models

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
      params: { name: (exercise as any)?.name }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.create',
      data: {},
      extras: { error: err }
    })
  }
}

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
      extras: { error: err }
    })
  }
}

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

    await (exercise as any).destroy()

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
      extras: { error: err }
    })
  }
}

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
      await (program as any).addExercise(exercise)

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
      extras: { error: err }
    })
  }
}

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
      await (program as any).removeExercise(exercise)

    responder.success({
      messageKey: 'program.exerciseRemoved',
      data: { programId: Number(programId), exerciseId: Number(exerciseId) }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'program.errors.removeExercise',
      data: {},
      extras: { error: err }
    })
  }
}

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
      extras: { error: err }
    })
  }
}

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
      extras: { error: err }
    })
  }
}

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
      extras: { error: err }
    })
  }
}
