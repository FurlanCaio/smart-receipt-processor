import mongoose from "mongoose"
import type { Response } from "express"
import { AppError } from "../errors/AppError.js"

export function handleControllerError(error: unknown, res: Response) {
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map(
      validationError => validationError.message
    );
    return res.status(400).json({
      success: false,
      message: 'Validation error in the provided data.',
      code: 'MONGOOSE_VALIDATION_ERROR',
      errors: messages
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  const message = error instanceof Error
    ? error.message
    : 'Internal Server Error'

  return res.status(500).json({ 
    success: false, 
    message,
    code: 'INTERNAL_SERVER_ERROR'
  });
}
