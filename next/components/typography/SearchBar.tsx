import SearchIcon from '@sanity/icons/Search'
import { UI_STRINGS } from '@shared/config/strings'
import {
  InputWrapper,
  type InputWrapperProps,
} from '@/components/typography/InputWrapper'
import { cn } from '@/lib/common-utils'
import type { SanityIconProps } from '@/types/component.types'

type SearchBarProps = {
  searchIconProps?: SanityIconProps & {
    hideSearchIcon?: boolean
  }
} & InputWrapperProps

/** Generic pre-styled search input. */
export const SearchBar = ({
  className,
  labelProps,
  wrapperProps,
  inputProps,
  searchIconProps,
  children,
  ...rest
}: SearchBarProps) => (
  <InputWrapper
    label={UI_STRINGS.scripts.searchLabel}
    {...rest}
    className={cn('grow', className)}
    labelProps={{
      ...labelProps,
      className: cn('sr-only', labelProps?.className),
    }}
    wrapperProps={{
      ...wrapperProps,
      className: cn('items-center gap-2 rounded-lg', wrapperProps?.className),
    }}
    inputProps={{
      ...inputProps,
      placeholder:
        inputProps?.placeholder ?? UI_STRINGS.scripts.searchPlaceholder,
      className: cn(
        'ui-body flex-1 outline-none placeholder:text-fg-400 w-full truncate',
        inputProps?.className
      ),
    }}
  >
    {children}
    {!searchIconProps?.hideSearchIcon && (
      <SearchIcon
        {...searchIconProps}
        className={cn('text-fg-400', searchIconProps?.className)}
      />
    )}
  </InputWrapper>
)
