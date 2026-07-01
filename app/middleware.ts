import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Definice chráněných segmentů v paměti Edge sítě
const isProtectedRoute = createRouteMatcher([
  '/terminal(.*)',
  '/laboratory(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Ochrana izolovaného vlákna v O(1) komplexitě
  if (isProtectedRoute(req)) {
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