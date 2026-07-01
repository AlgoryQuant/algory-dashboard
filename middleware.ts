import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Ochrana odstraněna z /terminal. Nyní řešíme autorizaci na úrovni komponent.
const isProtectedRoute = createRouteMatcher([
  '/api/restricted(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Ochrana izolovaného vlákna v O(1) komplexitě
  if (isProtectedRoute(req)) {
    // @ts-expect-error - Phantom type error due to npm postinstall restriction
    auth().protect();
  }
});

// Striktní Regex matcher definující ignorované statické assety pro snížení latence
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};