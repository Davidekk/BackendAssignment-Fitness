import { Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { StatusCodes } from 'http-status-codes'

const { User, Exercise, CompletedExercise } = models

export const getAllUsersBasic = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const users = await User.findAll({ attributes: ['id', 'nickName'] })
    res.json(users)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to load users', error: err })
  }
}

export const getOwnProfile = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'surname', 'nickName', 'age']
    })
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to load profile', error: err })
  }
}

export const trackCompletedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId
    const { exerciseId } = req.params
    const { duration } = req.body

    const exercise = await Exercise.findByPk(exerciseId)
    if (!exercise) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Exercise not found' })
      return
    }

    const completed = await CompletedExercise.create({
      userId,
      exerciseId,
      duration,
      completedAt: new Date()
    })

    res.status(StatusCodes.CREATED).json(completed)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to track exercise', error: err })
  }
}

export const getCompletedExercises = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId

    const completed = await CompletedExercise.findAll({
      where: { userId },
      include: [{ model: Exercise, attributes: ['id', 'name'] }],
      order: [['completedAt', 'DESC']]
    })

    res.json(completed)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to load completed exercises', error: err })
  }
}

export const removeTrackedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    const deleted = await CompletedExercise.destroy({
      where: { id, userId }
    })

    if (!deleted) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Tracked exercise not found' })
      return
    }

    res.status(StatusCodes.NO_CONTENT).send()
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to remove tracked exercise', error: err })
  }
}
