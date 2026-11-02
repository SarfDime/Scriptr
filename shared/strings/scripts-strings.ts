import type { FileType } from '../types/api.types'

const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF document',
  jpg: 'Image',
  jpeg: 'Image',
  png: 'Image',
  webp: 'Image',
  md: 'Markdown document',
  docx: 'Word document',
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
    yourScript: 'Your script',
    uploadedBy: 'Uploaded by',
    deletedUser: 'Deleted user',
    subject: 'Subject',
    examSession: 'Exam session',
    /** `session` is stored lowercase; `null` year means the session's year was
     * not recorded (a script saved before years existed). */
    examSessionValue: (session: string, year: number | null) => {
      const label = session.charAt(0).toUpperCase() + session.slice(1)
      return year === null ? label : `${label} ${year}`
    },
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
  vote: {
    upvote: 'Upvote',
    downvote: 'Downvote',
    score: (score: number) => `Score: ${score}`,
  },
  viewerDataFailed: {
    title: "Couldn't load your vote and saved state",
    description: 'Voting and saving are unavailable. Refresh to try again.',
  },
  favorite: {
    favorite: 'Favorite',
    add: 'Add to favorites',
    remove: 'Remove from favorites',
    failedTitleAdd: 'Failed to add script to favorites',
    failedTitleRemove: 'Failed to remove script from favorites',
    failedDescription: 'Please try again.',
  },
  download: {
    failedTitle: 'Download failed',
    failedDescription: 'Please try again.',
    preparing: 'Preparing…',
    defaultLabel: (fileType: FileType) => `Download (${fileType})`,
  },
  preview: {
    loadFailed: (fileName: string) => `Couldn't load ${fileName} for preview.`,
    filesTitle: 'Files',
    filesSubtitle: 'Choose a file to preview or download.',
    previewing: (fileName: string) => `Previewing ${fileName}`,
    previewFile: (fileName: string) => `Preview ${fileName}`,
    noPreviewSelected: 'Choose a previewable file to view it here.',
    enterFullscreen: 'Enter full screen',
    exitFullscreen: 'Exit full screen',
  },
  description: {
    title: 'Description',
    empty: 'No description provided.',
  },
  manage: {
    ariaLabel: 'Manage script',
    tryAgain: 'Please try again.',
    edit: 'Edit',
    editDialogTitle: 'Edit script',
    save: 'Save changes',
    cancel: 'Cancel',
    saved: 'Script updated',
    saveFailed: "Couldn't save your changes",
    addFilesFailed: "Couldn't add the files",
    addFilesNote:
      'New files are added to the script. Remove existing files from the script page.',
    delete: 'Delete',
    deleteTitle: 'Delete this script?',
    deleteDescription:
      'This permanently removes the script and its files. This cannot be undone.',
    deleteConfirm: 'Delete script',
    deleted: 'Script deleted',
    deleteFailed: "Couldn't delete the script",
    removeFile: 'Remove',
    removeFileAriaLabel: (fileName: string) => `Remove ${fileName}`,
    removeFileTitle: (fileName: string) => `Remove ${fileName}?`,
    removeFileDescription:
      'This permanently removes the file from the script. This cannot be undone.',
    removeFileConfirm: 'Remove file',
    fileRemoved: 'File removed',
    removeFileFailed: "Couldn't remove the file",
  },
} as const
