/** A collection of security constants used in the application. */
export const SECURITY_CONSTANTS = {
  ALLOWED_FRAME_ANCESTORS: `
  https://5t4g1ng.robotontine.com 
  https://app.tontine.com/ 
  http://localhost:8080
  http://localhost:3333/
  http://localhost:5173/
  *.sanity.io
  *.sanity.io/*
  https://tontine-web-5e800.sanity.studio/
  `,
  ALLOWED_FRAME_SRC_SOURCES: `
  https://app.tontine.com/ 
  http://localhost:8080/
  http://localhost:3333/
  http://localhost:5173/
  https://mytontinelite.netlify.app/ 
  https://5t4g1ng.robotontine.com/
  *.sanity.io
  *.sanity.io/*
  https://tontine-web-5e800.sanity.studio/
  *.google.com
  *.cloudflare.com
  *.cookiebot.eu
  *.cookiebot.com
  *.usercentrics.eu
  *.usercentrics.com
  `,
  ALLOWED_CONNECT_SOURCES: `
  ws:
  inferred.litix.io
  onesignal.com
  *.usercentrics.eu
  *.usercentrics.com
  *.onesignal.com
  *.cookiebot.eu
  *.cookiebot.com
  *.mux.com
  *.googleapis.com
  *.gstatic.com
  *.google.com
  *.cloudflareinsights.com
  *.cloudflare.com
  *.mytontine.com
  *.mixpanel.com
  https://mixpanel.mytontine.com
  https://5t4g1ng.robotontine.com/
  http://localhost:8082
  https://api-js.mixpanel.com
  `,
  ALLOWED_MEDIA_SOURCES: `
  cdn.sanity.io
  *.cookiebot.eu
  *.cookiebot.com
  *.mux.com 
  *.usercentrics.eu
  *.usercentrics.com
  `,
  ALLOWED_SCRIPT_SOURCES: `
  stream.mux.com
  onesignal.com
  *.usercentrics.eu
  *.usercentrics.com
  *.onesignal.com
  *.cookiebot.eu
  *.cookiebot.com
  *.gstatic.com
  *.googleapis.com
  *.google.com
  *.cloudflareinsights.com
  *.cloudflare.com
  *.mytontine.com
  *.mixpanel.com
  https://mixpanel.mytontine.com
  https://5t4g1ng.robotontine.com/
  https://api-js.mixpanel.com
  `,
  // denyUrls checks if the url includes the entries
  // Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/inboundfilters/#denyurls
  IGNORED_EXCEPTION_URLS: [
    /chrome-extension:\/\//, // Small edge case of chrome extensions causing errors
  ],
} as const
