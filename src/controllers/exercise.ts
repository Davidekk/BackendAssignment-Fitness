import { Request, Response, NextFunction } from 'express'

import { models } from '../db'

const { Exercise, Program } = models

export const listExercises = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const exercises = await Exercise.findAll({
    include: [
      {
        model: Program
      }
    ]
  })

  return res.json({
    data: exercises,
    message: 'List of exercises'
  })
}
