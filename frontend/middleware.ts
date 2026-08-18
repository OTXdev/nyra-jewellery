import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspHeader = `
    default-src 'none';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self';
    img-src 'self' https://ik.imagekit.io;
    font-src 'self';
    connect-src 'self' https://nyra-backend-a0qr.onrender.com https://vitals.vercel-insights.com;
    frame-src 'none';
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    media-src 'none';
    worker-src 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy-Report-Only', cspHeader)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // The response header is what the browser actually enforces (or, in
  // Report-Only mode, just reports on). Setting it on requestHeaders
  // above only makes it visible to Next's internal rendering — this
  // second line is the one the browser receives.
  response.headers.set('Content-Security-Policy-Report-Only', cspHeader)

  return response
}

export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}