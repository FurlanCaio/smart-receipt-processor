/**
 * Base class for custom application errors.
 * Allows returning appropriate HTTP status codes.
 */
class AppError extends Error {
  statusCode: number;
  code: string | null;

  constructor(message: string, statusCode = 500, code: string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400 Bad Request).
 * Used when input data is invalid.
 */
class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401 Unauthorized).
 * Used when credentials are invalid.
 */
class AuthenticationError extends AppError {
  constructor(message: string, code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403 Forbidden).
 * Used when the user does not have permission.
 */
class AuthorizationError extends AppError {
  constructor(message: string, code = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error (404 Not Found).
 */
class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

/**
 * Resource gone error (410 Gone).
 * Used when an account or resource has been permanently deleted.
 */
class ResourceGoneError extends AppError {
  constructor(message: string, code = 'RESOURCE_DELETED') {
    super(message, 410, code);
    this.name = 'ResourceGoneError';
  }
}

/**
 * Configuration error (500 Internal Server Error).
 * Used when environment variables or configuration are missing.
 */
class ConfigurationError extends AppError {
  constructor(message: string, code = 'CONFIGURATION_ERROR') {
    super(message, 500, code);
    this.name = 'ConfigurationError';
  }
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ResourceGoneError,
  ConfigurationError,
};
