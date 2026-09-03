import RemoveIcon from '@sanity/icons/Remove'
import { TextPreview } from '../../components/TextPreview'

const HrBlock = {
  name: 'horizontalRule',
  title: 'HR',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    {
      name: 'placeholder',
      title: 'Placeholder',
      type: 'string',
      hidden: true,
      initialValue: 'hr',
    },
  ],
  components: {
    preview: () => <TextPreview title={''} customClass='portable-hr' />,
  },
}

export { HrBlock }
