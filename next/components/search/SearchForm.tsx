'use client'

import { INPUT_MAX_LENGTH } from '@shared/config/next-constants'
import { UI_STRINGS } from '@shared/config/strings'
import { type Ref, type SubmitEvent, useId, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SearchBar } from '@/components/typography/SearchBar'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import {
  isValidSearchQuery,
  SEARCH_PAGE_PATH,
  SEARCH_QUERY_PARAM,
} from '@/lib/script-search'
import { FormContainer } from '../typography/FormContainer'

type SearchFormProps = {
  query?: string
  /** Header variant: just the input, no card and no submit button. */
  compact?: boolean
  /** Landmark name; two search landmarks on one page need different names. */
  ariaLabel?: string
  /** Receives the trimmed query. When given, the form submits through it
   * (the header uses the router) instead of the native GET navigation. */
  onValidSubmit?: (query: string) => void
  inputRef?: Ref<HTMLInputElement>
  errorClassName?: string
  className?: string
}

/** Plain GET form: submitting navigates to `/search?q=…`, so the page stays a
 * Server Component and results are shareable by URL. Without JS it behaves as
 * a normal form; with JS an invalid query (empty, whitespace-only, too long)
 * is stopped on submit and an inline message is shown.
 *
 * Client component only for that guard; it receives plain props, so the
 * `/search` page itself is still a Server Component. */
export const SearchForm = ({
  query = '',
  compact = false,
  ariaLabel = UI_STRINGS.scripts.search.formAriaLabel,
  onValidSubmit,
  inputRef,
  errorClassName,
  className,
}: SearchFormProps) => {
  const errorId = useId()
  const [invalid, setInvalid] = useState(false)

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    const value = new FormData(e.currentTarget).get(SEARCH_QUERY_PARAM)
    const raw = typeof value === 'string' ? value : ''

    if (!isValidSearchQuery(raw)) {
      e.preventDefault()
      setInvalid(true)
      return
    }
    if (onValidSubmit) {
      e.preventDefault()
      onValidSubmit(raw.trim())
    }
  }

  const searchBar = (
    <SearchBar
      // The sr-only label follows the same copy as the aria-label, so the two
      // never disagree on what this field searches.
      label={ariaLabel}
      invalid={invalid}
      inputOnChange={() => {
        if (invalid) setInvalid(false)
      }}
      inputProps={{
        ref: inputRef,
        name: SEARCH_QUERY_PARAM,
        type: 'search',
        placeholder: UI_STRINGS.scripts.search.placeholder,
        defaultValue: query,
        'aria-label': ariaLabel,
        'aria-invalid': invalid,
        'aria-describedby': invalid ? errorId : undefined,
      }}
    />
  )

  return (
    <search aria-label={ariaLabel} className={className}>
      <FormContainer
        action={SEARCH_PAGE_PATH}
        method='get'
        onSubmit={handleSubmit}
        noValidate
        className='relative'
      >
        {compact ? (
          searchBar
        ) : (
          <Box className='ui-above ui-cluster items-stretch gap-3'>
            {searchBar}
            <Button type='submit' className='button solid px-4'>
              {UI_STRINGS.scripts.search.submit}
            </Button>
          </Box>
        )}
        {invalid && (
          <Text
            id={errorId}
            role='alert'
            className={cn('ui-caption text-error-red pt-2', errorClassName)}
          >
            {UI_STRINGS.scripts.search.invalidQuery(INPUT_MAX_LENGTH)}
          </Text>
        )}
      </FormContainer>
    </search>
  )
}
