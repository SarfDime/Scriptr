import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SearchBar } from '@/components/typography/SearchBar'
import { SEARCH_PAGE_PATH, SEARCH_QUERY_PARAM } from '@/lib/script-search'
import { FormContainer } from '../typography/FormContainer'

/** Plain GET form: submitting navigates to `/search?q=…`, so the page stays a
 * Server Component and results are shareable by URL. */
export const SearchForm = ({ query }: { query: string }) => (
  <search aria-label={UI_STRINGS.scripts.search.formAriaLabel}>
    <FormContainer action={SEARCH_PAGE_PATH} method='get'>
      <Box className='ui-above ui-cluster items-stretch gap-3'>
        <SearchBar
          inputProps={{
            name: SEARCH_QUERY_PARAM,
            type: 'search',
            placeholder: UI_STRINGS.scripts.search.placeholder,
            defaultValue: query,
          }}
        />
        <Button type='submit' className='button solid px-4'>
          {UI_STRINGS.scripts.search.submit}
        </Button>
      </Box>
    </FormContainer>
  </search>
)
