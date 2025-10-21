import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLocalizedResponse } from '../services/localization.service'
import { AppError, isAppError } from '../errors/AppError'

export type ErrorHandlerOptions = {
  defaultMessageKey?: string
}

/**
 * Extracts error details from the given error object.
 * @param error
 */
const getErrorDetails = (error: unknown) => {
  if (isAppError(error)) {
    return error
  }

  return new AppError({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    messageKey: 'common.generalError',
    data: {}
  })
}

/**
 * Express error handling middleware.
 * @param _options
 */
export const errorHandler = (_options: ErrorHandlerOptions = {}) => {
  const handler: ErrorRequestHandler = (
    error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (res.headersSent) {
      next(error)
      return
    }

    const err = getErrorDetails(error)
    const responder = createLocalizedResponse(req, res)

    responder.error({
      status: err.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
      messageKey: err.messageKey,
      params: err.params,
      data: err.data ?? {},
      includeData: err.includeData ?? true,
      logError: error
    })
  }

  return handler
}
