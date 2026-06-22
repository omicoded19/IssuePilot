import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/app-error.js'

export function validateBody<T>(schema: ZodType<T>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'The request body is invalid.',
          result.error.flatten(),
        ),
      )
      return
    }

    response.locals.validatedBody = result.data
    next()
  }
}
