/**
 * Base class for all application errors
 */
class AppError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when input validation fails
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Error thrown when an external service is unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(serviceName, originalError = null) {
    const message = `${serviceName} is currently unavailable`;
    const details = originalError ? { originalError: originalError.message } : null;
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

/**
 * Error thrown when an internal operation fails
 */
class InternalError extends AppError {
  constructor(operation, originalError = null) {
    const message = `Failed to ${operation}`;
    const details = originalError ? { originalError: originalError.message } : null;
    super(message, 'INTERNAL_ERROR', 500, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  InternalError
};
