import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

type LocalizedResponseOptions<T> = {
  messageKey: string
  status?: number
  data?: T
  params?: Record<string, unknown>
  meta?: Record<string, unknown>
  extras?: Record<string, unknown>
  includeData?: boolean
}

/**
 * Generic function to send a localized response.
 *
 * @param req
 * @param res
 * @param options
 * @param defaultStatus
 * @param defaultIncludeData
 * @param defaultData
 */
const respond = <T>(
  req: Request,
  res: Response,
  options: LocalizedResponseOptions<T>,
  defaultStatus: number,
  defaultIncludeData: boolean,
  defaultData?: T
) => {
  const { messageKey, status, data, params, meta, extras, includeData } =
    options

  const resolvedStatus = status ?? defaultStatus
  const resolvedData = (data ?? defaultData) as T | undefined
  const shouldIncludeData =
    includeData ?? (defaultIncludeData || resolvedData !== undefined)

  const body: Record<string, unknown> = {
    message: req.translate(messageKey, params)
  }

  if (shouldIncludeData) {
    body.data = resolvedData
  }

  if (meta !== undefined) {
    body.meta = meta
  }

  if (extras) {
    Object.assign(body, extras)
  }

  return res.status(resolvedStatus).json(body)
}

/**
 * Creates a localized response handler for the given request and response.
 * @param req
 * @param res
 */
export const createLocalizedResponse = (req: Request, res: Response) => ({
  success<T>(options: LocalizedResponseOptions<T>) {
    return respond<T>(req, res, options, StatusCodes.OK, false)
  },
  error<T>(options: LocalizedResponseOptions<T>) {
    return respond<T>(
      req,
      res,
      {
        ...options,
        data: options.data ?? ({} as T)
      },
      StatusCodes.INTERNAL_SERVER_ERROR,
      true,
      options.data ?? ({} as T)
    )
  }
})

export type LocalizedResponse = ReturnType<typeof createLocalizedResponse>
