import { Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { StatusCodes } from 'http-status-codes'
import { createLocalizedResponse } from '../services/localization'

const { User, Exercise, CompletedExercise } = models

export const getAllUsersBasic = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const users = await User.findAll({ attributes: ['id', 'nickName'] })
    responder.success({
      messageKey: 'user.basicList',
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

export const getOwnProfile = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const userId = req.user.userId
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'surname', 'nickName', 'age']
    })
    if (!user) {
      responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'user.notFound',
        data: {}
      })
      return
    }
    responder.success({
      messageKey: 'user.profileLoaded',
      data: user
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'user.errors.loadProfile',
      data: {},
      extras: { error: err }
    })
  }
}

export const trackCompletedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const userId = req.user.userId
    const { exerciseId } = req.params
    const { duration } = req.body

    const exercise = await Exercise.findByPk(exerciseId)
    if (!exercise) {
      responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'exercise.notFound',
        data: {}
      })
      return
    }

    const completed = await CompletedExercise.create({
      userId,
      exerciseId,
      duration,
      completedAt: new Date()
    })

    responder.success({
      status: StatusCodes.CREATED,
      messageKey: 'exercise.tracked',
      data: completed
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.track',
      data: {},
      extras: { error: err }
    })
  }
}

export const getCompletedExercises = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const userId = req.user.userId

    const completed = await CompletedExercise.findAll({
      where: { userId },
      include: [{ association: 'exercise', attributes: ['id', 'name'] }],
      order: [['completedAt', 'DESC']]
    })

    responder.success({
      messageKey: 'exercise.completedList',
      data: completed
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.loadCompleted',
      data: {},
      extras: { error: err }
    })
  }
}

export const removeTrackedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const responder = createLocalizedResponse(req, res)

  try {
    const userId = req.user.userId
    const { id } = req.params

    const deleted = await CompletedExercise.destroy({
      where: { id, userId }
    })

    if (!deleted) {
      responder.error({
        status: StatusCodes.NOT_FOUND,
        messageKey: 'exercise.trackedNotFound',
        data: {}
      })
      return
    }

    responder.success({
      messageKey: 'exercise.trackedRemoved',
      data: { id: Number(id) }
    })
  } catch (err) {
    responder.error({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: 'exercise.errors.removeTracked',
      data: {},
      extras: { error: err }
    })
  }
}
