import type { ExamSession } from '../types/academic.types'
import type { FileType } from '../types/api.types'
import type { LocalizedText } from '../types/localization.types'

const FILE_TYPE_LABELS: Record<FileType, LocalizedText> = {
  pdf: { en: 'PDF document', mk: 'PDF документ' },
  jpg: { en: 'Image', mk: 'Слика' },
  jpeg: { en: 'Image', mk: 'Слика' },
  png: { en: 'Image', mk: 'Слика' },
  webp: { en: 'Image', mk: 'Слика' },
  md: { en: 'Markdown document', mk: 'Markdown документ' },
  docx: { en: 'Word document', mk: 'Word документ' },
  xlsx: { en: 'Excel spreadsheet', mk: 'Excel табела' },
}

/** A session is named for the month it is held in, not by translating the
 * stored value: English says "January", Macedonian "Јануарска". */
const EXAM_SESSION_LABELS: Record<ExamSession, LocalizedText> = {
  january: { en: 'January', mk: 'Јануарска' },
  june: { en: 'June', mk: 'Јунска' },
  september: { en: 'September', mk: 'Септемвриска' },
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

/** A stored value the list does not know (a script filed before sessions were
 * fixed) still renders: it keeps its raw name in both languages. */
const examSessionLabel = (session: string): LocalizedText =>
  EXAM_SESSION_LABELS[session as ExamSession] ?? {
    en: capitalize(session),
    mk: capitalize(session),
  }

const withYear = (label: string, year: number | null) =>
  year === null ? label : `${label} ${year}`

const previewStates = {
  en: { available: 'preview available', download: 'download to view' },
  mk: { available: 'достапен преглед', download: 'преземи за преглед' },
} as const

/** Every user-facing string on the script detail page and its components.
 * Entries that depend on a value (positions, names, file types) are small
 * functions so wording stays here instead of leaking into components.
 * Strings shared with other script screens (preview/download labels, the
 * "no files" message) live in `UI_STRINGS.scripts.actions`.
 *
 * The `{ en, mk }` entries are the source of truth. There is no English-view
 * export: every call site reads the reader's language (a Server Component with
 * `getServerStrings`, a Client Component with `useStrings`). */
export const SCRIPT_STRINGS_PACK = {
  info: {
    ariaLabel: { en: 'Script information', mk: 'Информации за скриптата' },
    yourScript: { en: 'Your script', mk: 'Твојата скрипта' },
    uploadedBy: { en: 'Uploaded by', mk: 'Објавена од' },
    deletedUser: { en: 'Deleted user', mk: 'Избришан корисник' },
    subject: { en: 'Subject', mk: 'Предмет' },
    professor: { en: 'Professor', mk: 'Професор' },
    examSession: { en: 'Exam session', mk: 'Испитна сесија' },
    /** `year` is null when the session's year was not recorded (a script
     * saved before years existed). */
    examSessionValue: (session: string, year: number | null): LocalizedText => {
      const label = examSessionLabel(session)
      return {
        en: withYear(label.en, year),
        mk: withYear(label.mk, year),
      }
    },
    downloads: { en: 'Downloads', mk: 'Преземања' },
    updated: { en: 'Updated', mk: 'Ажурирана' },
    reportTrigger: { en: 'Report', mk: 'Пријави' },
  },
  additionalReading: {
    title: {
      en: 'Additional reading',
      mk: 'Дополнителна литература',
    },
    empty: {
      en: 'No additional reading links were added to this script.',
      mk: 'Кон оваа скрипта не се додадени линкови за дополнителна литература.',
    },
  },
  files: {
    title: { en: 'Files', mk: 'Датотеки' },
  },
  file: {
    name: (position: number, fileType: FileType): LocalizedText => ({
      en: `Script file ${position} (${FILE_TYPE_LABELS[fileType].en})`,
      mk: `Датотека ${position} од скриптата (${FILE_TYPE_LABELS[fileType].mk})`,
    }),
    label: (position: number): LocalizedText => ({
      en: `File ${position}`,
      mk: `Датотека ${position}`,
    }),
    previewAriaLabel: (fileName: string): LocalizedText => ({
      en: `Preview ${fileName}`,
      mk: `Прегледај ${fileName}`,
    }),
    thumbnailAlt: (fileName: string): LocalizedText => ({
      en: `Thumbnail of ${fileName}`,
      mk: `Сликичка од ${fileName}`,
    }),
    summary: (fileType: FileType, canPreview: boolean): LocalizedText => ({
      en: `${FILE_TYPE_LABELS[fileType].en} · ${
        canPreview ? previewStates.en.available : previewStates.en.download
      }`,
      mk: `${FILE_TYPE_LABELS[fileType].mk} · ${
        canPreview ? previewStates.mk.available : previewStates.mk.download
      }`,
    }),
  },
  vote: {
    upvote: { en: 'Upvote', mk: 'Позитивен глас' },
    downvote: { en: 'Downvote', mk: 'Негативен глас' },
    score: (score: number): LocalizedText => ({
      en: `Score: ${score}`,
      mk: `Резултат: ${score}`,
    }),
  },
  viewerDataFailed: {
    title: {
      en: "Couldn't load your vote and saved state",
      mk: 'Не успеа вчитувањето на твојот глас и зачуваната состојба',
    },
    description: {
      en: 'Voting and saving are unavailable. Refresh to try again.',
      mk: 'Гласањето и зачувувањето не се достапни. Освежи за да пробаш повторно.',
    },
  },
  favorite: {
    favorite: { en: 'Favorite', mk: 'Зачувај' },
    add: { en: 'Add to favorites', mk: 'Додај во омилени' },
    remove: { en: 'Remove from favorites', mk: 'Отстрани од омилени' },
    failedTitleAdd: {
      en: 'Failed to add script to favorites',
      mk: 'Не успеа додавањето во омилени',
    },
    failedTitleRemove: {
      en: 'Failed to remove script from favorites',
      mk: 'Не успеа отстранувањето од омилени',
    },
    failedDescription: { en: 'Please try again.', mk: 'Обиди се повторно.' },
  },
  download: {
    failedTitle: { en: 'Download failed', mk: 'Преземањето не успеа' },
    failedDescription: { en: 'Please try again.', mk: 'Обиди се повторно.' },
    preparing: { en: 'Preparing…', mk: 'Се подготвува…' },
    defaultLabel: (fileType: FileType): LocalizedText => ({
      en: `Download (${fileType})`,
      mk: `Преземи (${fileType})`,
    }),
  },
  preview: {
    loadFailed: (fileName: string): LocalizedText => ({
      en: `Couldn't load ${fileName} for preview.`,
      mk: `Не успеа вчитувањето на ${fileName} за преглед.`,
    }),
    filesTitle: { en: 'Files', mk: 'Датотеки' },
    filesSubtitle: {
      en: 'Choose a file to preview or download.',
      mk: 'Избери датотека за преглед или преземање.',
    },
    previewing: (fileName: string): LocalizedText => ({
      en: `Previewing ${fileName}`,
      mk: `Преглед на ${fileName}`,
    }),
    previewFile: (fileName: string): LocalizedText => ({
      en: `Preview ${fileName}`,
      mk: `Прегледај ${fileName}`,
    }),
    noPreviewSelected: {
      en: 'Choose a previewable file to view it here.',
      mk: 'Избери датотека што може да се прегледа за да ја видиш тука.',
    },
    enterFullscreen: { en: 'Enter full screen', mk: 'Цел екран' },
    exitFullscreen: { en: 'Exit full screen', mk: 'Излези од цел екран' },
  },
  description: {
    title: { en: 'Description', mk: 'Опис' },
    empty: { en: 'No description provided.', mk: 'Нема опис.' },
  },
  manage: {
    ariaLabel: { en: 'Manage script', mk: 'Управувај со скриптата' },
    tryAgain: { en: 'Please try again.', mk: 'Обиди се повторно.' },
    edit: { en: 'Edit', mk: 'Уреди' },
    editDialogTitle: { en: 'Edit script', mk: 'Уреди скрипта' },
    save: { en: 'Save changes', mk: 'Зачувај промени' },
    cancel: { en: 'Cancel', mk: 'Откажи' },
    saved: { en: 'Script updated', mk: 'Скриптата е ажурирана' },
    saveFailed: {
      en: "Couldn't save your changes",
      mk: 'Не успеа зачувувањето на промените',
    },
    addFilesFailed: {
      en: "Couldn't add the files",
      mk: 'Не успеа додавањето на датотеките',
    },
    addFilesNote: {
      en: 'New files are added to the script. Remove existing files from the script page.',
      mk: 'Новите датотеки се додаваат кон скриптата. Постоечките отстрани ги од страницата на скриптата.',
    },
    delete: { en: 'Delete', mk: 'Избриши' },
    deleteTitle: {
      en: 'Delete this script?',
      mk: 'Да се избрише оваа скрипта?',
    },
    deleteDescription: {
      en: 'This permanently removes the script and its files. This cannot be undone.',
      mk: 'Ова трајно ја брише скриптата и нејзините датотеки. Не може да се врати.',
    },
    deleteConfirm: { en: 'Delete script', mk: 'Избриши скрипта' },
    deleted: { en: 'Script deleted', mk: 'Скриптата е избришана' },
    deleteFailed: {
      en: "Couldn't delete the script",
      mk: 'Не успеа бришењето на скриптата',
    },
    removeFile: { en: 'Remove', mk: 'Отстрани' },
    removeFileAriaLabel: (fileName: string): LocalizedText => ({
      en: `Remove ${fileName}`,
      mk: `Отстрани ${fileName}`,
    }),
    removeFileTitle: (fileName: string): LocalizedText => ({
      en: `Remove ${fileName}?`,
      mk: `Да се отстрани ${fileName}?`,
    }),
    removeFileDescription: {
      en: 'This permanently removes the file from the script. This cannot be undone.',
      mk: 'Ова трајно ја отстранува датотеката од скриптата. Не може да се врати.',
    },
    removeFileConfirm: { en: 'Remove file', mk: 'Отстрани датотека' },
    fileRemoved: { en: 'File removed', mk: 'Датотеката е отстранета' },
    removeFileFailed: {
      en: "Couldn't remove the file",
      mk: 'Не успеа отстранувањето на датотеката',
    },
  },
} as const
