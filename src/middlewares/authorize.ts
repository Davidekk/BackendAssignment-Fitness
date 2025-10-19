import { Request, Response, NextFunction, RequestHandler } from 'express'
import { USER_ROLE } from '../utils/enums'

export function authorizeRole(requiredRole: USER_ROLE): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    next()
  }
}
