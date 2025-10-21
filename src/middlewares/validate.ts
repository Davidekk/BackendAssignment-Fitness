import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { StatusCodes } from 'http-status-codes'

/**
 * Middleware to validate request data against a Zod schema.
 *
 * @param schema
 * @param target
 */
export const validate =
  (schema: z.ZodType, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) =>
        req.translate(issue.message)
      )

      res.status(StatusCodes.BAD_REQUEST).json({
        message: req.translate('common.validationError'),
        errors: errorMessages
      })
      return
    }

    if (target === 'query') {
      Object.assign(req.query, result.data)
    } else if (target === 'params') {
      Object.assign(req.params, result.data)
    } else {
      req.body = result.data
    }

    next()
  }
