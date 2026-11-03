'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { AstronautIllustration } from '@/components/ui/AstronautIllustration'

/**
 * Catches failures in the root layout itself, where `error.tsx` cannot help.
 *
 * It is rendered *instead of* the root layout, and `globals.css` is imported by
 * that layout — so none of the app's classes, CSS variables or shared
 * components exist here. Next's error document does ship `--next-error-*`
 * (with a `prefers-color-scheme` switch), so those drive the colours and the
 * rest stays inline; the fallbacks keep the page readable if the variable names
 * ever change.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--next-error-bg, #fff)',
          color: 'var(--next-error-text, #171717)',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <AstronautIllustration
            style={{ height: '10rem', width: 'auto', maxWidth: '100%' }}
          />
          <h1
            style={{
              fontSize: '1.5rem',
              margin: '1rem 0 0.5rem',
              color: 'var(--next-error-title, #171717)',
            }}
          >
            {UI_STRINGS.general.unexpectedError}
          </h1>
          <p
            style={{
              margin: '0 0 1.5rem',
              lineHeight: 1.5,
              color: 'var(--next-error-message, #171717)',
            }}
          >
            {UI_STRINGS.general.errors.description}
          </p>
          <button
            type='button'
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'var(--next-error-btn-text, #fff)',
              background: 'var(--next-error-btn-bg, #171717)',
              border: 'var(--next-error-btn-border, 1px solid transparent)',
            }}
          >
            {UI_STRINGS.general.errors.retry}
          </button>
        </div>
      </body>
    </html>
  )
}
