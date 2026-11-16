'use client'

// The device-type store the background canvases read to scale their drawings down
// on a phone.

// Phones (any orientation) and touch-only tablets
export const MOBILE_QUERY =
  '(max-width: 767px), (hover: none) and (pointer: coarse)'

// For useSyncExternalStore: tracks MOBILE_QUERY (false on the server)
export const subscribeToMobile = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches
export const getIsMobileOnServer = () => false
