import { CollapseIcon } from '@sanity/icons/Collapse'
import { ExpandIcon } from '@sanity/icons/Expand'

import { Button } from '@sanity/ui'
import { useEffect, useState } from 'react'

/** Toggle compact mode */
function CompactModeToggle() {
  const [compactMode, setCompactMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem('sanity-compact-mode')
      return storedValue === 'true'
    }
    return false
  })

  useEffect(() => {
    const html = document.documentElement
    if (compactMode) {
      html.classList.add('compact-mode')
      window.localStorage.setItem('sanity-compact-mode', 'true')
    } else {
      html.classList.remove('compact-mode')
      window.localStorage.setItem('sanity-compact-mode', 'false')
    }
  }, [compactMode])

  return (
    <Button
      selected={compactMode}
      onClick={() => setCompactMode((value) => !value)}
      className='custom-button compact-mode-toggle'
    >
      {compactMode ? (
        <ExpandIcon className='icon' />
      ) : (
        <CollapseIcon className='icon' />
      )}
    </Button>
  )
}

export { CompactModeToggle }
