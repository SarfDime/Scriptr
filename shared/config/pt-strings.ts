/** Strings for the Portable Text inline editor (toolbar, actions, demo page). */
export const PT_STRINGS = {
  toolbar: {
    clearFormatting: { title: 'Clear formatting' },
    style: { title: 'Font size' },
    list: { label: 'List', title: 'Lists' },
    format: { label: 'Format', title: 'Text formatting' },
    color: { label: 'Color', title: 'Text color' },
    weight: { label: 'Weight', title: 'Font weight' },
    align: { label: 'Align', title: 'Text alignment' },
  },
  decoratorLabels: {
    em: 'Italic',
    underline: 'Underline',
    'strike-through': 'Strikethrough',
  } as Record<string, string>,
  weightLabels: {
    semibold: 'Semibold',
    strong: 'Bold',
    black: 'Black',
  } as Record<string, string>,
  editor: {
    preview: 'Preview',
    save: 'Save',
    cancel: 'Cancel',
    notConfigured: 'This field is not configured for inline editing yet.',
    saveFailed: 'Unable to save content.',
  },
  demo: {
    eyebrow: 'Component demo',
    title: 'Portable Text editor',
    description:
      'This page is local-only. Preview uses your current draft without writing to Sanity.',
    editContent: 'Edit content',
    previewTitle: 'Rendered preview',
  },
} as const
