import { createClient } from 'next-sanity'
import {
  sanityApiVersion,
  sanityAuthToken,
  sanityDataset,
  sanityProjectId,
  studioURL,
} from '../env'

/**
 * The drafts reader: development, staging and deploy previews.
 *
 * `useCdn` describes the read, not the deployment. A drafts read carries a token
 * and must be current, so it goes to the API origin — the CDN cannot cache it
 * usefully and would only add a layer that can answer with published documents.
 */
export const client = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
  stega: {
    studioUrl: studioURL,
    filter: (props) => {
      const { sourcePath: _s, filterDefault } = props
      //   if (
      //     // Buttons
      //     sourcePath.at(-1) === 'buttonColorVariant' ||
      //     sourcePath.at(-1) === 'buttonLabel' ||
      //     sourcePath.at(-1) === 'slug' ||
      //     sourcePath.at(-1) === 'pageSlug' ||
      //     sourcePath.at(-1) === 'backgroundColor' ||
      //     sourcePath.at(-1) === 'textPosition' ||
      //     // Hero
      //     sourcePath.at(-1) === 'heroVariants' ||
      //     // PDF
      //     sourcePath.at(-1) === 'manuscript' ||
      //     sourcePath.at(-1) === 'originalFilename' ||
      //     // Eligibility Modal
      //     sourcePath.at(-1) === 'countryLogicType' ||
      //     sourcePath.at(-1) === 'pageLogicType' ||
      //     sourcePath.at(-1) === 'countriesToExclude' ||
      //     sourcePath.at(-1) === 'countriesToExclude' ||
      //     sourcePath.at(-1) === 'countriesToShow' ||
      //     sourcePath.at(-1) === 'pagesToExclude' ||
      //     sourcePath.at(-1) === 'pagesToShow' ||
      //     // Info Hub
      //     sourcePath.at(-1) === 'layout' ||
      //     // Link Selector
      //     sourcePath.at(-1) === 'linkType' ||
      //     sourcePath.at(-1) === 'customParams' ||
      //     sourcePath.at(-1) === 'customParamsButton' ||
      //     sourcePath.at(-1) === 'customLink' ||
      //     sourcePath.at(-1) === 'sectionSlug' ||
      //     // Images
      //     sourcePath.at(-1) === 'alt' ||
      //     sourcePath.at(-1) === 'src' ||
      //     sourcePath.at(-1) === 'image' ||
      //     sourcePath.at(-1) === 'cornerRadius' ||
      //     sourcePath.at(-1) === 'rounded' ||
      //     sourcePath.at(-1) === 'hexagon' ||
      //     sourcePath.at(-1) === 'edgeInset'
      //   ) {
      //     return false
      //   }

      return filterDefault(props)
    },
  },
})

/**
 * The published reader: what the live site serves.
 *
 * Published documents are public and cacheable, so they go through Sanity's CDN
 * (`cache-control: max-age=60`).
 */
export const prodClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  perspective: 'published',
  token: sanityAuthToken,
  useCdn: true,
})
