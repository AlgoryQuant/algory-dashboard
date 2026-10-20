import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { shouldRunClerk } from './lib/clerk-configured';

const isProtectedRoute = createRouteMatcher(['/api/restricted(.*)']);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

function unavailableAuth(req: NextRequest) {
  if (isProtectedRoute(req)) {
    return NextResponse.json({ error: 'Authentication is unavailable' }, { status: 401 });
  }
  return NextResponse.next();
}

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!shouldRunClerk()) {
    return unavailableAuth(req);
  }

  try {
    return await withClerk(req, event);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
    console.error('Clerk proxy failed');
    return unavailableAuth(req);
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
