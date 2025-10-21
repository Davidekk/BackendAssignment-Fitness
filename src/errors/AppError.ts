export type AppErrorOptions = {
  status: number
  messageKey: string
  params?: Record<string, unknown>
  data?: Record<string, unknown>
  includeData?: boolean
}

export class AppError extends Error {
  status: number
  messageKey: string
  params?: Record<string, unknown>
  data?: Record<string, unknown>
  includeData?: boolean

  constructor({
    status,
    messageKey,
    params,
    data,
    includeData
  }: AppErrorOptions) {
    super(messageKey)
    this.status = status
    this.messageKey = messageKey
    this.params = params
    this.data = data
    this.includeData = includeData
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError
