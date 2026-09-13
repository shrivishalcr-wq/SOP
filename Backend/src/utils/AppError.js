/**
 * @file AppError.js
 * @description Custom error class for application-specific errors.
 * Provides structured error handling with HTTP status codes.
 * @module utils/AppError
 */

export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
