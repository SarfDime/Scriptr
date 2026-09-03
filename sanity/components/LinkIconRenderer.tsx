import type { ComponentProps } from '../types/common.types'

export const LinkIconRenderer = ({
  icon,
  renderDefault,
  customClass,
  value,
  ...rest
}: ComponentProps) => (
  <span className={`link-render ${customClass}`}>
    {renderDefault?.({ value, ...rest })}
    <a contentEditable={false} href={value?.url}>
      <sup className='link-render-icon'>{icon}</sup>
    </a>
  </span>
)
