import { LaunchIcon } from '@sanity/icons/Launch'
import { LinkIcon } from '@sanity/icons/Link'
import { LinkIconRenderer } from '../../components/LinkIconRenderer'
import type { ComponentProps } from '../../types/common.types'
import { isExternalLink } from '../util-functions/utilFunctions'
import { validationRules } from '../validation'

export const Annotations = [
  {
    name: 'link',
    type: 'object',
    title: 'External or Internal Link',
    description:
      'For external links (ex: https://google.com), for internal (ex: /about-us/#the-team or /about-us/)',
    fields: [
      {
        name: 'url',
        title: 'URL or Internal Path',
        description:
          'External URL (starting with https://) or internal path (starting with /) or just / for homepage.',
        validation: validationRules.urlValidation,
        type: 'string',
      },
    ],
    components: {
      annotation: (props: ComponentProps) => {
        return LinkIconRenderer({
          ...props,
          customClass: 'external',
          icon: isExternalLink(props?.value?.url ?? '/') ? (
            <LaunchIcon />
          ) : (
            <LinkIcon />
          ),
          value: props?.value,
        })
      },
    },
  },
]
