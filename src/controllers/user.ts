import { Request, Response, NextFunction } from 'express'
import { models } from '../db'

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
    res.status(500).json({ message: 'Failed to load users', error: err })
  }
}

export const getOwnProfile = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = (req.user as any).userId
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'surname', 'nickName', 'age']
    })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile', error: err })
  }
}

export const trackCompletedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = (req.user as any).userId
    const { exerciseId } = req.params
    const { duration } = req.body

    if (!duration || Number(duration) <= 0) {
      res.status(400).json({ message: 'Invalid duration' })
      return
    }

    const exercise = await Exercise.findByPk(exerciseId)
    if (!exercise) {
      res.status(404).json({ message: 'Exercise not found' })
      return
    }

    const completed = await CompletedExercise.create({
      userId,
      exerciseId,
      duration,
      completedAt: new Date()
    })

    res.status(201).json(completed)
  } catch (err) {
    res.status(500).json({ message: 'Failed to track exercise', error: err })
  }
}

export const getCompletedExercises = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = (req.user as any).userId

    const completed = await CompletedExercise.findAll({
      where: { userId },
      include: [{ model: Exercise, attributes: ['id', 'name'] }],
      order: [['completedAt', 'DESC']]
    })

    res.json(completed)
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to load completed exercises', error: err })
  }
}

export const removeTrackedExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    const userId = (req.user as any).userId
    const { id } = req.params

    const deleted = await CompletedExercise.destroy({
      where: { id, userId }
    })

    if (!deleted) {
      res.status(404).json({ message: 'Tracked exercise not found' })
      return
    }

    res.status(204).send()
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to remove tracked exercise', error: err })
  }
}
