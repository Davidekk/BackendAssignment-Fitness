import { Request, Response, NextFunction } from 'express'

import { models } from '../db'
import { createLocalizedResponse } from '../services/localization'
const { Program } = models

export const listPrograms = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const programs = await Program.findAll()

  const responder = createLocalizedResponse(req, res)

  return responder.success({
    messageKey: 'program.list',
    data: programs
  })
}
