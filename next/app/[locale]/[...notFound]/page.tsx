import { notFound } from 'next/navigation'

/**
 * Any address under a valid language that no page matched.
 *
 * Without a catch-all, an unmatched URL inside a dynamic segment never reaches
 * the segment's `not-found.tsx`: Next answers with its own language-less 404
 * that has no chrome. Taking the URL and throwing is what renders
 * `app/[locale]/not-found.tsx` inside the localized layout.
 *
 * Next 16.4 still sends the *initial* HTML as its built-in error shell for a
 * `notFound()` under a dynamic root layout (vercel/next.js#100596); the
 * localized page arrives in the flight payload and is what the reader sees. The
 * status is 404 either way. `docs/PROGRESS.md` records the
 * decision to keep it this way and the re-test for when that issue closes.
 */
export default function NotFoundCatchAll(): never {
  notFound()
}

/** Throwing is the whole render, so `next dev`'s instant-UI validation can only
 * ever see the 404 it raises. */
export const instant = false
