export interface ActionErrorResult {
  ok: false;
  message: string;
  code?: string;
  meta?: Record<string, unknown>;
}
export interface OkResult<T> {
  ok: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export type Result<T> = OkResult<T> | ActionErrorResult;
// Type guard
export function isOk<T>(r: Result<T>): r is OkResult<T> {
  return r.ok;
}
// Unwrap helper (throws on error branch)
export function unwrap<T>(r: Result<T>): T {
  if (!r.ok) {
    throw new Error(r.message);
  }
  return r.data;
}

// Optional safe accessor (returns default on error)
export function getOrElse<T>(r: Result<T>, fallback: T): T {
  return r.ok ? r.data : fallback;
}

export const to  = (
  error: unknown,
  meta?: Record<string, unknown>
): ActionErrorResult => {
  // Check if this is a Next.js navigation error (redirect or notFound)
  // These errors should NOT be caught - they need to propagate to Next.js router
  if (error && typeof error === 'object' && 'digest' in error) {
    const digest = String((error as { digest: unknown }).digest);
    if (digest.includes('NEXT_REDIRECT') || digest.includes('NEXT_NOT_FOUND')) {
      // Re-throw navigation errors so Next.js can handle them
      throw error;
    }
  }

  let message: string;
  if (error instanceof Error) {
    message = error.message || 'Unknown error';
  }
  else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message);
  }
  else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'An unexpected error occurred';
  }

  return { ok: false, message, meta };
};

// Action result type
export type ActionResult<T> =
  | { ok: true; data: T; message?: string; meta?: Record<string, unknown> }
  
  | { ok: false; message: string; data?: never; code?: string; meta?: Record<string, unknown> };
