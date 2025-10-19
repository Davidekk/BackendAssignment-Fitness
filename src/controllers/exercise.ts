import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'

import { models } from '../db'

const { Exercise, Program } = models

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

  res.json({
    page,
    totalPages,
    totalItems: count,
    items: exercises,
    message: 'List of exercises'
  })
}
