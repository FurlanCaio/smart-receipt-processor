const { AppError }= require('../errors/AppError');

function handleControllerError(error, res) {
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors).map(err => err.message);
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

  return res.status(500).json({ 
    success: false, 
    message: error.message || 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR'
  });
}

module.exports = handleControllerError;