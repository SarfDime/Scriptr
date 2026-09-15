import { NextLink } from '@/components/common/NextLink'
import { Badge } from '@/components/ui/Badge'

type BackLinkVariant = 'brand' | 'red' | 'plain'

type BackLinkProps = {
  href: string
  label: string
  variant?: BackLinkVariant
}

const variantClassName: Record<BackLinkVariant, string> = {
  brand: 'ui-badge cp-brand-interactive',
  red: 'ui-badge cp-red-interactive',
  plain: 'cp-unstyled border border-grey-300',
}

export const BackLink = ({ href, label, variant = 'brand' }: BackLinkProps) =>
  variant === 'plain' ? (
    <NextLink href={href}>
      <Badge className={variantClassName.plain}>{label}</Badge>
    </NextLink>
  ) : (
    <NextLink href={href} className={variantClassName[variant]}>
      {label}
    </NextLink>
  )
