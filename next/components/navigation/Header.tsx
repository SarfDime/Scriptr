'use client'

import Menu from '@sanity/icons/Menu'
import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { cn } from '@/lib/common-utils'
import { Button } from '../common/Button'
import { Text } from '../typography/Text'
import { HeaderActions } from './NavigationLinks'

export const Header = () => {
  const [_mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 items-center justify-between',
        'border-b border-grey-300 bg-background-100/65 backdrop-blur',
        'px-5 lg:px-10'
      )}
    >
      <Button
        className='button subtle p-2 lg:hidden'
        onClick={() => setMobileOpen(true)}
        aria-label={UI_STRINGS.navigation.openNavigation}
      >
        <Menu />
      </Button>

      <Text className='ui-caption hidden lg:block'>
        Thursday, September 4 <span className='mx-2 text-grey-400'>/</span> Week
        5
      </Text>

      <HeaderActions />
    </header>
  )
}
