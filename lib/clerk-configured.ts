/** True only when both Clerk keys are present. Values are never logged. */
export function clerkKeysConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

/**
 * Keyless Clerk works in `next dev`. On Vercel (NODE_ENV=production) a missing
 * key makes clerkMiddleware throw, which Vercel surfaces as
 * MIDDLEWARE_INVOCATION_FAILED.
 */
export function shouldRunClerk(): boolean {
  return clerkKeysConfigured() || process.env.NODE_ENV !== 'production';
}
