import { DEFAULT_LOCALE } from '../config/localization-constants'
import { PORTABLE_TEXT_LIMITS } from '../config/portable-text-limits'
import type { LocalizedText } from '../types/localization.types'
import { getStrings } from '../utils/localized-strings'

/**
 * Every user-facing string in the comments UI. Entries that depend on a value
 * (counts, names, labels) are small functions so wording and pluralisation
 * stay here instead of leaking into components.
 *
 * The `{ en, mk }` entries are the source of truth; `COMMENT_STRINGS` at the
 * bottom is the English view for the call sites with no reader — the API's
 * own validation messages in `hono/`.
 */
export const COMMENT_STRINGS_PACK = {
  general: {
    title: { en: 'Comments', mk: 'Коментари' },
    newest: { en: 'Newest', mk: 'Најнови' },
    top: { en: 'Top', mk: 'Најдобри' },
    sortComments: { en: 'Sort comments', mk: 'Сортирај коментари' },
    showMoreComments: {
      en: 'Show more comments',
      mk: 'Прикажи уште коментари',
    },
    showMoreReplies: { en: 'Show more replies', mk: 'Прикажи уште одговори' },
    showReplies: { en: 'Show replies', mk: 'Прикажи одговори' },
    hideReplies: { en: 'Hide replies', mk: 'Скриј одговори' },
    loadingComments: {
      en: 'Loading comments…',
      mk: 'Се вчитуваат коментарите…',
    },
    loadingReplies: {
      en: 'Loading replies…',
      mk: 'Се вчитуваат одговорите…',
    },
    commentNoun: { en: 'comment', mk: 'коментарот' },
    emptyState: {
      en: 'No comments yet — be the first to say something.',
      mk: 'Сè уште нема коментари — биди прв што ќе напише нешто.',
    },
    deletedUser: { en: 'Deleted user', mk: 'Избришан корисник' },
    unknownAuthor: { en: 'N/A', mk: 'Н/П' },
    tryAgain: { en: 'Please try again.', mk: 'Обиди се повторно.' },
    loadingEditor: {
      en: 'Loading comment editor…',
      mk: 'Се вчитува уредувачот на коментари…',
    },
    loadCommentsError: {
      en: 'Could not load comments.',
      mk: 'Не успеа вчитувањето на коментарите.',
    },
    loadMoreCommentsError: {
      en: 'Could not load more comments.',
      mk: 'Не успеа вчитувањето на повеќе коментари.',
    },
    loadRepliesError: {
      en: 'Could not load replies.',
      mk: 'Не успеа вчитувањето на одговорите.',
    },
    minimumLength: (): LocalizedText => ({
      en: `Enter at least ${PORTABLE_TEXT_LIMITS.commentMinimumCharacters} characters to post.`,
      mk: `Внеси најмалку ${PORTABLE_TEXT_LIMITS.commentMinimumCharacters} знаци за да објавиш.`,
    }),
    edited: { en: 'Edited', mk: 'Изменето' },
  },
  composer: {
    openButton: { en: 'Write a comment', mk: 'Напиши коментар' },
    editorAriaLabel: { en: 'Write a comment', mk: 'Напиши коментар' },
    previewLabel: { en: 'Preview', mk: 'Преглед' },
    showPreview: { en: 'Preview', mk: 'Преглед' },
    hidePreview: { en: 'Hide preview', mk: 'Скриј преглед' },
    clear: { en: 'Clear', mk: 'Исчисти' },
    cancel: { en: 'Cancel', mk: 'Откажи' },
    submit: { en: 'Post comment', mk: 'Објави коментар' },
    postError: {
      en: 'Couldn’t post comment',
      mk: 'Не успеа објавувањето на коментарот',
    },
    characterCount: (characters: number): LocalizedText => ({
      en: `${characters} ${characters === 1 ? 'character' : 'characters'}`,
      mk: `${characters} ${characters === 1 ? 'знак' : 'знаци'}`,
    }),
    saveEdit: { en: 'Save changes', mk: 'Зачувај промени' },
    editError: {
      en: 'Couldn’t edit comment',
      mk: 'Не успеа уредувањето на коментарот',
    },
  },
  reply: {
    action: { en: 'Reply', mk: 'Одговори' },
    editorAriaLabel: { en: 'Write a reply', mk: 'Напиши одговор' },
    cancel: { en: 'Cancel', mk: 'Откажи' },
    submit: { en: 'Post reply', mk: 'Објави одговор' },
    postError: {
      en: 'Couldn’t post reply',
      mk: 'Не успеа објавувањето на одговорот',
    },
    replyingTo: (name: string): LocalizedText => ({
      en: `· replying to ${name}`,
      mk: `· одговор на ${name}`,
    }),
  },
  actions: {
    like: { en: 'Like', mk: 'Свиѓа ми се' },
    report: { en: 'Report', mk: 'Пријави' },
    delete: { en: 'Delete', mk: 'Избриши' },
    edit: { en: 'Edit', mk: 'Уреди' },
  },
  reactions: {
    reactWith: (label: string, total: number): LocalizedText => ({
      en: `React with ${label} (${total})`,
      mk: `Реагирај со ${label} (${total})`,
    }),
    labels: {
      like: { en: 'Like', mk: 'Свиѓа ми се' },
      hate: { en: 'Dislike', mk: 'Не ми се свиѓа' },
      funny: { en: 'Funny', mk: 'Смешно' },
      sad: { en: 'Sad', mk: 'Тажно' },
      confused: { en: 'Confused', mk: 'Збунето' },
    },
    showAll: { en: 'Add reaction', mk: 'Додај реакција' },
    hideAll: { en: 'Hide reactions', mk: 'Скриј реакции' },
    updateError: {
      en: 'Couldn’t update reaction',
      mk: 'Не успеа ажурирањето на реакцијата',
    },
  },
  deletion: {
    confirmTitle: {
      en: 'Delete this comment?',
      mk: 'Да се избрише овој коментар?',
    },
    confirmDescription: {
      en: 'This permanently deletes the comment and its replies.',
      mk: 'Ова трајно го брише коментарот и неговите одговори.',
    },
    confirmLabel: { en: 'Delete', mk: 'Избриши' },
    error: {
      en: 'Couldn’t delete comment',
      mk: 'Не успеа бришењето на коментарот',
    },
  },
  moderation: {
    discardTitle: { en: 'Discard this draft?', mk: 'Да се отфрли овој нацрт?' },
    discardDescription: {
      en: 'Your comment draft will be lost.',
      mk: 'Нацртот на коментарот ќе се изгуби.',
    },
    discardConfirm: { en: 'Discard draft', mk: 'Отфрли нацрт' },
  },
  validation: {
    minimumLength: (minimum: number): LocalizedText => ({
      en: `Comment must be at least ${minimum} characters long and cannot contain headings, lists, or text alignment`,
      mk: `Коментарот мора да има најмалку ${minimum} знаци и не може да содржи наслови, списоци или порамнување на текст`,
    }),
    replyMinimumLength: (minimum: number): LocalizedText => ({
      en: `Reply must be at least ${minimum} characters long and cannot contain headings, lists, or text alignment`,
      mk: `Одговорот мора да има најмалку ${minimum} знаци и не може да содржи наслови, списоци или порамнување на текст`,
    }),
    maximumSize: (maximumBytes: number): LocalizedText => ({
      en: `Comment content must be no larger than ${maximumBytes} bytes`,
      mk: `Содржината на коментарот не смее да биде поголема од ${maximumBytes} бајти`,
    }),
  },
} as const

/** English view for the call sites with no reader: the API's validation
 * messages, which answer a request rather than a page. */
export const COMMENT_STRINGS = getStrings(COMMENT_STRINGS_PACK, DEFAULT_LOCALE)
