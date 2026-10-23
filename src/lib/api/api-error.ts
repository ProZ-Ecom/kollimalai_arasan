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
  if (error instanceof ApiError) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    ("statusCode" in error || (error as any).name === "ApiError") &&
    typeof (error as any).statusCode === "number"
  );
}

export function extractPrismaDuplicateDetails(error: unknown): {
  value?: string;
  field?: string;
  model?: string;
  message: string;
} {
  const prismaError = error as {
    code?: string;
    message?: string;
    meta?: Record<string, any>;
    cause?: any;
  };

  const meta = prismaError?.meta || {};
  let duplicateValue: string | undefined;
  let keyOrField: string | undefined;
  const model: string | undefined = meta.modelName;

  // 1. Check driverAdapterError cause (@prisma/adapter-mariadb / MySQL 1062)
  const cause = meta.driverAdapterError?.cause || prismaError?.cause;
  const originalMessage: string =
    cause?.originalMessage || prismaError?.message || "";

  const dupMatchWithKey = originalMessage.match(
    /Duplicate entry ['"]([^'"]*)['"] for key ['"]([^'"]*)['"]/i
  );
  const dupMatchValueOnly = !dupMatchWithKey
    ? originalMessage.match(/Duplicate entry ['"]([^'"]*)['"]/i)
    : null;

  if (dupMatchWithKey) {
    duplicateValue = dupMatchWithKey[1];
    keyOrField = dupMatchWithKey[2];
  } else if (dupMatchValueOnly) {
    duplicateValue = dupMatchValueOnly[1];
  }

  // 2. Check meta.target (standard Prisma)
  if (!keyOrField && meta.target) {
    keyOrField = Array.isArray(meta.target)
      ? meta.target.join(", ")
      : String(meta.target);
  }

  // 3. Check constraint index from driver adapter
  if (!keyOrField && cause?.constraint?.index) {
    keyOrField = cause.constraint.index;
  }

  // 4. Map key/index to human-friendly field name
  let friendlyField = keyOrField;
  if (keyOrField) {
    const rawKey = keyOrField.toLowerCase();
    if (rawKey.includes("slug")) {
      friendlyField = "code / slug";
    } else if (rawKey.includes("sku")) {
      friendlyField = "SKU";
    } else if (rawKey.includes("email")) {
      friendlyField = "email";
    } else if (rawKey.includes("phone")) {
      friendlyField = "phone number";
    } else if (rawKey.includes("code")) {
      friendlyField = "code";
    } else if (rawKey.includes("name")) {
      friendlyField = "name";
    } else {
      const parts = keyOrField.split(".");
      friendlyField = parts[parts.length - 1]
        .replace(/^uq_|^idx_/, "")
        .replace(/_/g, " ");
    }
  }

  // 5. Map model/table to human-friendly entity name
  let entity = model || (cause?.table ? cause.table.replace(/_/g, " ") : "record");
  const entityLower = entity.toLowerCase();
  if (entityLower === "productcategory" || entityLower === "product_categories") {
    entity = "Category";
  } else if (entityLower === "product" || entityLower === "products") {
    entity = "Product";
  } else if (entityLower === "productvariant" || entityLower === "product_variants") {
    entity = "Item";
  } else if (entityLower === "variantunitprice" || entityLower === "variant_unit_prices") {
    entity = "Item SKU / Pack Size";
  } else if (entityLower === "productbrand" || entityLower === "product_brands") {
    entity = "Brand";
  } else if (entityLower === "product_hsn_codes" || entityLower === "producthsncodes") {
    entity = "HSN Code";
  }

  // 6. Formulate precise, user-friendly message
  let message: string;
  if (duplicateValue && friendlyField) {
    message = `A ${entity} with ${friendlyField} "${duplicateValue}" already exists in the database`;
  } else if (duplicateValue) {
    message = `A ${entity} with the value "${duplicateValue}" already exists in the database`;
  } else if (friendlyField) {
    message = `A ${entity} with the same ${friendlyField} already exists in the database`;
  } else {
    message = `A ${entity} with the same value already exists in the database`;
  }

  return { value: duplicateValue, field: friendlyField, model, message };
}

export function handlePrismaError(error: unknown): ApiError {
  const prismaError = error as { code?: string; meta?: Record<string, unknown> };

  switch (prismaError.code) {
    case "P2002": {
      const details = extractPrismaDuplicateDetails(error);
      return ApiError.conflict(details.message);
    }
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
