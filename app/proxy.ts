// import { setCookie } from 'cookies-next'
// import { type NextRequest, NextResponse } from 'next/server'
// import { i18nRouter } from 'next-i18n-router'
// import { SECURITY_CONSTANTS } from './data-resource/security-constants'
// import i18nConfig from './i18nConfig'
// import { isCypress, websiteDomain } from './serverless/keys'

// /** Set security-related headers. */
// function setSecurityHeaders({
//   headers,
//   nonce,
//   cspHeader,
// }: {
//   headers: Headers
//   nonce: string
//   cspHeader: string
// }): void {
//   headers.set('X-Frame-Options', 'SAMEORIGIN')
//   headers.set('Content-Security-Policy', cspHeader)
//   headers.set('x-nonce', nonce)
//   headers.set(
//     'Strict-Transport-Security',
//     'max-age=63072000; includeSubDomains; preload'
//   )
//   headers.set('Cross-Origin-Opener-Policy', 'same-origin')
// }

// /** Generate the Content Security Policy header value. */
// function generateCspHeader({ nonce }: { nonce: string }): string {
//   return `
//     default-src 'self';
//     script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline' http: https: https://consent.cookiebot.com https://consent.cookiebot.eu https://consentcdn.cookiebot.com;
//     style-src 'self' 'unsafe-inline';
//     connect-src 'self' ${SECURITY_CONSTANTS.ALLOWED_CONNECT_SOURCES};
//     img-src 'self' blob: data: ${SECURITY_CONSTANTS.ALLOWED_MEDIA_SOURCES};
//     object-src 'none';
//     base-uri 'self';
//     media-src 'self' data: blob: ${SECURITY_CONSTANTS.ALLOWED_MEDIA_SOURCES};
//     form-action 'self';
//     frame-ancestors 'self' ${SECURITY_CONSTANTS.ALLOWED_FRAME_ANCESTORS};
//     frame-src 'self' ${SECURITY_CONSTANTS.ALLOWED_FRAME_SRC_SOURCES};
//     upgrade-insecure-requests;
//     script-src-elem 'self' 'unsafe-inline' ${SECURITY_CONSTANTS.ALLOWED_SCRIPT_SOURCES};
//     script-src-attr 'self' 'unsafe-inline' ${SECURITY_CONSTANTS.ALLOWED_SCRIPT_SOURCES};
//   `
//     .replace(/\s{2,}/g, ' ')
//     .trim()
// }

// export async function middleware(request: NextRequest) {
//   if (isCypress) return NextResponse.next()

//   const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
//   const cspHeader = generateCspHeader({ nonce })

//   const isPdfRequest = request?.nextUrl?.pathname.endsWith('.pdf')

//   const regionFromHeaders = request.headers.get('cf-ipcountry')

//   // PDF File requests
//   if (isPdfRequest) {
//     const canonicalUrl = `${websiteDomain}${request.nextUrl.pathname}`
//     const response = NextResponse.next()
//     response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`)
//     setSecurityHeaders({ headers: response.headers, nonce, cspHeader })
//     return response
//   }

//   const i18nResponse = i18nRouter(request, i18nConfig)

//   await setCookie('country', regionFromHeaders, {
//     res: i18nResponse,
//     req: request,
//   })

//   setSecurityHeaders({ headers: i18nResponse.headers, nonce, cspHeader })

//   return i18nResponse
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      *
//      */
//     {
//       source:
//         '/((?!api|static|_next|favicon.ico|assets/|sitemap|manifest|feed|.*.txt|.*.pdf).*)',
//     },
//   ],
// }
