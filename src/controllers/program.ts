import { Request, Response, NextFunction } from 'express'

import { models } from '../db'

const { Program } = models

export const listPrograms = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const programs = await Program.findAll()

  return res.json({
    data: programs,
    message: 'List of programs'
  })
}
