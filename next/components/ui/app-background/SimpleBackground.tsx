import { Box } from '../../common/Box'

/** Static brand-colored gradient backdrop. Shown in simple mode and whenever
 * no StarCanvas is configured in Sanity. Styling lives in `ui-simple-backdrop`.
 */
export const SimpleBackground = () => (
  <Box
    aria-hidden
    className='ui-simple-backdrop pointer-events-none fixed inset-0 z-[-1]'
  />
)
