import type { ErrorRequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.')

  if (!(error instanceof AppError)) {
    console.error(error)
  }

  response.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    },
  })
}
