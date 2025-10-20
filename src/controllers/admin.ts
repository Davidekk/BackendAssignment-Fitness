import { NextFunction, Request, Response } from 'express'
import { models } from '../db'
import { StatusCodes } from 'http-status-codes'

const { User, Exercise, Program } = models

export const createExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const exercise = await Exercise.create(req.body)
    res.status(StatusCodes.CREATED).json(exercise)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to create exercise', error: err })
  }
}

export const updateExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params

    const [updated] = await Exercise.update(req.body, { where: { id } })
    if (!updated)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Exercise not found' })

    const updatedExercise = await Exercise.findByPk(id)
    res.json(updatedExercise)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to update exercise', error: err })
  }
}

export const deleteExercise = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params

    const deleted = await Exercise.destroy({ where: { id } })
    if (!deleted)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Exercise not found' })

    res.status(StatusCodes.NO_CONTENT).send()
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to delete exercise', error: err })
  }
}

export const addExerciseToProgram = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const { programId, exerciseId } = req.params
    const program = await Program.findByPk(programId)
    const exercise = await Exercise.findByPk(exerciseId)

    if (!program || !exercise)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Program or exercise not found' })

    await (program as any).addExercise(exercise)
    res.json({ message: 'Exercise added to program' })
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to add exercise to program', error: err })
  }
}

export const removeExerciseFromProgram = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const { programId, exerciseId } = req.params
    const program = await Program.findByPk(programId)
    const exercise = await Exercise.findByPk(exerciseId)

    if (!program || !exercise)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Program or exercise not found' })
    await (program as any).removeExercise(exercise)

    res.json({ message: 'Exercise removed from program' })
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to remove exercise from program', error: err })
  }
}

export const getAllUsers = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const users = await User.findAll()
    res.json(users)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to load users', error: err })
  }
}

export const getUserDetail = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'User not found' })

    res.json(user)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to load user', error: err })
  }
}

export const updateUser = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params

    const [updated] = await User.update(req.body, { where: { id } })
    if (!updated)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'User not found' })

    const updatedUser = await User.findByPk(id)
    res.json(updatedUser)
  } catch (err) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'Failed to update user', error: err })
  }
}
