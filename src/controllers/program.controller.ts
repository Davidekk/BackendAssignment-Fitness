import { Request, Response, NextFunction } from 'express'

import { models } from '../db'
import { createLocalizedResponse } from '../services/localization.service'
const { Program: ProgramController } = models

/**
 * List all programs.
 * @route GET /programs
 * @returns 200 with programs list.
 */
export const listPrograms = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<any> => {
  const programs = await ProgramController.findAll()

  const responder = createLocalizedResponse(req, res)

  return responder.success({
    messageKey: 'program.list',
    data: programs
  })
}
