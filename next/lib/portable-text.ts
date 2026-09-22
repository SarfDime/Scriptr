import type { PortableTextValue } from '../../shared/types/portable-text.types'

// Re-exported so other files can import the type via '@/lib/portable-text'
// instead of each guessing their own relative depth back to shared/types/ —
// one place to fix if this path is wrong, not five.
export type { PortableTextValue }

/**
 * Temporary bridge from plain-text input to a minimal valid Portable Text
 * block array, until the project's real Portable Text editor is wired into
 * these forms. Extracted here (rather than duplicated) because it's used by
 * both CommentSection and CreateScriptModal — the DRY rule's 2+ usage bar.
 */
export function plainTextToPortableText(text: string): PortableTextValue {
  return [
    { _type: 'block', children: [{ _type: 'span', text }] },
  ] as unknown as PortableTextValue
}
