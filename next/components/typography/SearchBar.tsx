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
      className: cn(
        'items-center gap-2 rounded-lg border border-grey-300 bg-background-200 px-3 py-2',
        'focus-within:border-brand-300',
        wrapperProps?.className
      ),
    }}
    inputProps={{
      ...inputProps,
      placeholder: UI_STRINGS.scripts.searchPlaceholder,
      className: cn(
        'ui-body flex-1 bg-transparent outline-none placeholder:text-fg-400',
        inputProps?.className
      ),
    }}
  >
    {children}
    {!searchIconProps?.hideSearchIcon && (
      <SearchIcon
        {...searchIconProps}
        className={cn('shrink-0 text-fg-400', searchIconProps?.className)}
      />
    )}
  </InputWrapper>
)
