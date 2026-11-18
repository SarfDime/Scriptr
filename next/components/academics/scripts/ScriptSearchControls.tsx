'use client'

import SearchIcon from '@sanity/icons/Search'
import { type SubmitEvent, useState } from 'react'
import { SEARCH_QUERY_PARAM } from '@/lib/script-search'
import { useUIStrings } from '@/providers/locale/use-strings'
import { Button } from '../../common/Button'
import { FormContainer } from '../../typography/FormContainer'
import { SearchBar } from '../../typography/SearchBar'

type ScriptSearchFilterProps = {
  query: string
  onQueryChange: (value: string) => void
  /** The script feed's own address. When present the typed query can be sent
   * to the server, which searches every script in the study rather than only
   * the ones on this page. */
  searchPath?: string
}

/** The list's own filter. Without `searchPath` it only narrows the scripts
 * already loaded; with one it also offers a real search across the study. */
export const ScriptSearchFilter = ({
  query,
  onQueryChange,
  searchPath,
}: ScriptSearchFilterProps) => {
  const ui = useUIStrings()
  const field = (
    <SearchBar
      inputVal={query}
      inputOnChange={(event) => onQueryChange(event.target.value)}
      inputClearButton
      inputOnClear={() => onQueryChange('')}
      inputProps={searchPath ? { name: SEARCH_QUERY_PARAM } : undefined}
      className='min-w-0'
    />
  )

  if (!searchPath) return field

  // An empty local filter has nothing to send, and Enter would reload the feed.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (query.trim().length === 0) event.preventDefault()
  }

  return (
    <FormContainer
      action={searchPath}
      method='get'
      noValidate
      onSubmit={handleSubmit}
      className='flex min-w-0 grow basis-64 items-stretch gap-2'
    >
      {field}
      {query.trim().length > 0 && (
        <Button type='submit' className='button subtle whitespace-nowrap'>
          <SearchIcon aria-hidden='true' className='shrink-0' />
          <span className='max-sm:sr-only'>{ui.scripts.feed.searchAll}</span>
        </Button>
      )}
    </FormContainer>
  )
}

/** The bar while the page shows server-side search results: it starts with
 * that query and submits a new one only when it changed. */
export const ScriptSearchBar = ({
  path,
  query,
}: {
  path: string
  query: string
}) => {
  const ui = useUIStrings()
  const [value, setValue] = useState(query)
  const trimmed = value.trim()
  const disabled = trimmed.length === 0 || trimmed === query.trim()

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (disabled) event.preventDefault()
  }

  return (
    <FormContainer
      action={path}
      method='get'
      noValidate
      onSubmit={handleSubmit}
      className='flex w-full min-w-0 items-stretch gap-2'
    >
      <SearchBar
        inputVal={value}
        inputOnChange={(event) => setValue(event.target.value)}
        inputClearButton
        inputOnClear={() => setValue('')}
        inputProps={{ name: SEARCH_QUERY_PARAM }}
        className='min-w-0'
      />
      <Button
        type='submit'
        disabled={disabled}
        className='button solid h-10 whitespace-nowrap px-4'
      >
        {ui.scripts.search.submit}
      </Button>
    </FormContainer>
  )
}
