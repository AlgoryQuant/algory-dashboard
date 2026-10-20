/** Client-safe: only the publishable key is visible in the browser bundle. */
export function clerkBrowserEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}
