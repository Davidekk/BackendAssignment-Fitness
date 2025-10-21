import { Request, Response, NextFunction, RequestHandler } from 'express'
import { USER_ROLE } from '../utils/enums'
import { StatusCodes } from 'http-status-codes'

/**
 * Middleware to authorize users based on their role.
 * @param requiredRole
 */
export function authorizeRole(requiredRole: USER_ROLE): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: req.translate('common.forbidden') })
      return
    }
    next()
  }
}
