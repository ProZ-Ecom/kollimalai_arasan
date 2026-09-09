import { HTTP_STATUS, type HttpStatusCode } from "./http-status";

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors?: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: string[],
    isOperational = true
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors?: string[]) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(message = "You must be logged in") {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message = "You don't have permission") {
    return new ApiError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(message, HTTP_STATUS.CONFLICT);
  }

  static tooManyRequests(message = "Too many requests. Please try again later.") {
    return new ApiError(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  static validation(errors: string[], message = "Validation failed") {
    return new ApiError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  static internal(message = "Something went wrong") {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, undefined, false);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function handlePrismaError(error: unknown): ApiError {
  const prismaError = error as { code?: string; meta?: Record<string, unknown> };

  switch (prismaError.code) {
    case "P2002":
      return ApiError.conflict(
        `A record with the same value already exists${
          prismaError.meta?.target ? ` for field: ${String(prismaError.meta.target)}` : ""
        }`
      );
    case "P2025":
      return ApiError.notFound("The requested record was not found");
    case "P2003":
      return ApiError.badRequest("Related record not found");
    case "P2014":
      return ApiError.badRequest("Required relation violation");
    case "P2011":
      return ApiError.badRequest("Null constraint violation");
    case "P2012":
      return ApiError.badRequest("Missing required value");
    default:
      return ApiError.internal("A database error occurred");
  }
}
