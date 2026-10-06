import type { FileType } from '../types/api.types'

const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF document',
  jpg: 'Image',
  jpeg: 'Image',
  png: 'Image',
  webp: 'Image',
  md: 'Markdown document',
  doc: 'Word document',
  docx: 'Word document',
  xls: 'Excel spreadsheet',
  xlsx: 'Excel spreadsheet',
}

/** Every user-facing string on the script detail page and its components.
 * Entries that depend on a value (positions, names, file types) are small
 * functions so wording stays here instead of leaking into components.
 * Strings shared with other script screens (preview/download labels, the
 * "no files" message) live in `UI_STRINGS.scripts.actions`. */
export const SCRIPT_STRINGS = {
  info: {
    ariaLabel: 'Script information',
    uploadedBy: 'Uploaded by',
    deletedUser: 'Deleted user',
    subject: 'Subject',
    examSession: 'Exam session',
    downloads: 'Downloads',
    updated: 'Updated',
    reportTrigger: 'Report script',
  },
  additionalReading: {
    title: 'Additional reading',
    empty: 'No additional reading links were added to this script.',
  },
  files: {
    title: 'Files',
  },
  file: {
    name: (position: number, fileType: FileType) =>
      `Script file ${position} (${fileType})`,
    label: (position: number) => `File ${position}`,
    previewAriaLabel: (fileName: string) => `Preview ${fileName}`,
    thumbnailAlt: (fileName: string) => `Thumbnail of ${fileName}`,
    summary: (fileType: FileType, canPreview: boolean) =>
      `${FILE_TYPE_LABELS[fileType]} · ${
        canPreview ? 'preview available' : 'download to view'
      }`,
  },
  download: {
    failedTitle: 'Download failed',
    failedDescription: 'Please try again.',
    preparing: 'Preparing…',
    defaultLabel: (fileType: FileType) => `Download (${fileType})`,
  },
  preview: {
    loadFailed: (fileName: string) => `Couldn't load ${fileName} for preview.`,
  },
  description: {
    title: 'Description',
    empty: 'No description provided.',
  },
} as const
