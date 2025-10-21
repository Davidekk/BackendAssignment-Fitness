import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'

import { models } from '../db'
import { createLocalizedResponse } from '../services/localization.service'
const { Exercise, Program } = models

/**
 * List exercises with optional pagination, filtering, and search.
 * @route GET /exercises
 * @returns 200 with paginated exercises.
 */
export const listExercises = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const offset = (page - 1) * limit
  const programID = req.query.programID
    ? Number(req.query.programID)
    : undefined
  const search = req.query.search ? String(req.query.search) : undefined

  const where: any = {}

  if (programID) {
    where.programID = programID
  }

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` }
  }

  const { rows: exercises, count } = await Exercise.findAndCountAll({
    where,
    include: [
      {
        model: Program,
        attributes: ['id', 'name']
      }
    ],
    limit,
    offset,
    order: [['id', 'ASC']]
  })

  const totalPages = Math.ceil(count / limit)

  const responder = createLocalizedResponse(req, res)

  return responder.success({
    messageKey: 'exercise.list',
    data: exercises,
    meta: {
      page,
      totalPages,
      totalItems: count
    }
  })
}
