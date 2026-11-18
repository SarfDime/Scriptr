'use client'

import { INPUT_MAX_LENGTH } from '@shared/config/next-constants'
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
import { useUIStrings } from '@/providers/locale/use-strings'
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
  /** Every keystroke, for a caller that must know whether the field holds
   * text (the header's icon doubles as submit and close). */
  onValueChange?: (value: string) => void
  /** Show the input's clear button. The header bar wants it; the page's own
   * form is submitted with a button beside it. */
  clearable?: boolean
  /** Overrides the catalog placeholder, for the header's study variant. */
  placeholder?: string
  inputRef?: Ref<HTMLInputElement>
  errorClassName?: string
  className?: string
}

/** Plain GET form: submitting navigates to `/search?q=…`, so the page stays a
 * Server Component and results are shareable by URL. The header passes
 * `onValidSubmit` and navigates itself — to the study's `/scripts?q=…` when it
 * is in a study. Without JS it behaves as a normal form; with JS an invalid
 * query (empty, whitespace-only, too long) is stopped on submit and an inline
 * message is shown.
 *
 * Client component only for that guard; it receives plain props, so the
 * `/search` page itself is still a Server Component. */
export const SearchForm = ({
  query = '',
  compact = false,
  ariaLabel,
  placeholder,
  onValidSubmit,
  onValueChange,
  clearable = false,
  inputRef,
  errorClassName,
  className,
}: SearchFormProps) => {
  const ui = useUIStrings()
  const searchLabel = ariaLabel ?? ui.scripts.search.formAriaLabel
  const searchPlaceholder = placeholder ?? ui.scripts.search.placeholder
  const errorId = useId()
  const [value, setValue] = useState(query)
  const [invalid, setInvalid] = useState(false)

  const handleChange = (next: string) => {
    setValue(next)
    if (invalid) setInvalid(false)
    onValueChange?.(next)
  }

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    const submitted = new FormData(e.currentTarget).get(SEARCH_QUERY_PARAM)
    const raw = typeof submitted === 'string' ? submitted : ''

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
      label={searchLabel}
      invalid={invalid}
      inputVal={value}
      inputOnChange={(event) => handleChange(event.target.value)}
      inputClearButton={clearable}
      inputOnClear={() => handleChange('')}
      inputProps={{
        ref: inputRef,
        name: SEARCH_QUERY_PARAM,
        type: 'search',
        placeholder: searchPlaceholder,
        'aria-label': searchLabel,
        'aria-invalid': invalid,
        'aria-describedby': invalid ? errorId : undefined,
      }}
    />
  )

  return (
    <search aria-label={searchLabel} className={className}>
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
              {ui.scripts.search.submit}
            </Button>
          </Box>
        )}
        {invalid && (
          <Text
            id={errorId}
            role='alert'
            className={cn('ui-caption text-error-red pt-2', errorClassName)}
          >
            {ui.scripts.search.invalidQuery(INPUT_MAX_LENGTH)}
          </Text>
        )}
      </FormContainer>
    </search>
  )
}
