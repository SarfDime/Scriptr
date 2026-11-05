import type { TextProps } from '@/components/typography/Text'

/**
 * Styling shared by the create and edit script dialogs. Keeping it here means
 * the two forms cannot drift apart: they render the same shell, sections and
 * field labels. Every value mirrors what the create dialog established.
 */

/** The classification row: subject + reading links beside the selects. */
export const SCRIPT_FORM_COLUMNS_CLASS =
  'grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'

/** Dialog chrome: a fixed-height card whose body scrolls on its own. */
export const SCRIPT_FORM_DIALOG_CLASS =
  'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:max-w-3xl open:flex open:flex-col'

/** The scrolling body; its sections are separated by a divider. */
export const SCRIPT_FORM_BODY_CLASS = 'ui-stack overflow-y-auto p-4'

/** Footer with the secondary (clear/cancel) and submit actions. */
export const SCRIPT_FORM_FOOTER_CLASS =
  'ui-cluster shrink-0 justify-end gap-2 border-grey-200 border-t px-3 py-2.5 shadow-above-inside'

/** Every script form field uses the same label style. */
export const SCRIPT_FIELD_LABEL_PROPS: TextProps = {
  className: 'text-base font-semibold',
}
