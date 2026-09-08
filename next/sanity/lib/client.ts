import { createClient } from 'next-sanity'
import { isProd } from '@/config/env'
import {
  sanityApiVersion,
  sanityAuthToken,
  sanityDataset,
  sanityProjectId,
  studioURL,
} from '../env'

export const client = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: isProd,
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

export const prodClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  perspective: 'published',
  token: sanityAuthToken,
  useCdn: isProd,
})
