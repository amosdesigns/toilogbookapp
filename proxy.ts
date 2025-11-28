import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()

    // Check if user is archived
    const { sessionClaims } = await auth()
    const publicMetadata = sessionClaims?.metadata as { archived?: boolean } | undefined
    if (publicMetadata?.archived === true) {
      // Redirect archived users to a blocked page or sign out
      const signOutUrl = new URL('/sign-in', request.url)
      signOutUrl.searchParams.set('archived', 'true')
      return NextResponse.redirect(signOutUrl)
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
