/**
 * Client-side error handling utilities
 * For type-safe error handling in catch blocks
 */

/**
 * Standard error structure that can represent any thrown error
 */
export interface AppError {
  message: string
  code?: string
  status?: number
  cause?: unknown
}

/**
 * Type guard to check if an error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard to check if an error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

/**
 * Type guard to check if an error has a code property
 */
export function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}

/**
 * Extract a safe error message from any thrown value
 * This is the primary function to use in catch blocks
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error instances
  if (isError(error)) {
    return error.message || 'An error occurred'
  }

  // Handle objects with message property
  if (hasMessage(error)) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback for unknown error types
  console.error('Unknown error type:', error)
  return 'An unexpected error occurred'
}

/**
 * Convert any error into a structured AppError
 * Useful when you need more than just the message
 */
export function toAppError(error: unknown): AppError {
  const message = getErrorMessage(error)
  const code = hasCode(error) ? error.code : undefined

  return {
    message,
    code,
    cause: error,
  }
}

/**
 * Format an error for display to users
 * Sanitizes technical details while preserving useful information
 */
export function formatErrorForUser(error: unknown): string {
  const appError = toAppError(error)

  // Remove technical stack traces or sensitive data
  const sanitized = appError.message
    .replace(/at\s+.*?\n/g, '') // Remove stack trace lines
    .replace(/\(.*?:\d+:\d+\)/g, '') // Remove file locations
    .trim()

  return sanitized || 'Something went wrong. Please try again.'
}

/**
 * Handle async errors with proper typing
 * Use this for form submissions and async operations
 *
 * @example
 * ```typescript
 * const handleSubmit = handleAsyncError(async (data) => {
 *   const result = await myAction(data)
 *   if (!result.ok) throw new Error(result.message)
 *   toast.success('Success!')
 * }, (error) => {
 *   toast.error(getErrorMessage(error))
 * })
 * ```
 */
export function handleAsyncError<TArgs extends unknown[], TReturn>(
  asyncFn: (...args: TArgs) => Promise<TReturn>,
  onError: (error: unknown) => void
): (...args: TArgs) => Promise<TReturn | void> {
  return async (...args: TArgs) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      onError(error)
    }
  }
}

/**
 * A simple async error boundary for catching and logging errors
 * Returns null on error, allowing you to handle the failure gracefully
 *
 * @example
 * ```typescript
 * const data = await safeAsync(fetchData(), 'Failed to fetch data')
 * if (!data) {
 *   // Handle the error case
 *   return
 * }
 * ```
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error)
    return null
  }
}

/**
 * Type-safe error wrapper for catch blocks
 * Use this type instead of 'any' in catch blocks
 *
 * @example
 * ```typescript
 * try {
 *   // your code
 * } catch (error: CatchError) {
 *   toast.error(getErrorMessage(error))
 * }
 * ```
 */
export type CatchError = unknown
