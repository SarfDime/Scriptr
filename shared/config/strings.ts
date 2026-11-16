import type { FlagTargetType } from '../types/api.types'
import type { LocalizedText } from '../types/localization.types'
import { getStrings, mkCount } from '../utils/localized-strings'
import { DEFAULT_LOCALE } from './localization-constants'

/** What a report is about, named for the sentence that asks for one. */
const REPORT_TARGET_NOUN: Record<FlagTargetType, string> = {
  user: 'корисникот',
  script: 'скриптата',
  comment: 'коментарот',
}

/** `3.5MB`, `20MB`, `4.21MB`: sizes as the user reads them. */
const toMegabytes = (bytes: number) =>
  `${Number((bytes / (1024 * 1024)).toFixed(2))}MB`

/**
 * Every reader-facing string outside the per-area collections in
 * `shared/strings/`. `{ en, mk }` entries are translated; a plain string has
 * not been translated yet and reads the same in every language. `UI_STRINGS` at
 * the bottom is the English view for call sites that do not go through
 * `useStrings`.
 */
export const UI_STRINGS_PACK = {
  general: {
    restrictedAction: {
      en: "This action isn't available right now — your account is currently restricted.",
      mk: 'Ова дејство во моментов не е достапно — твојата сметка е ограничена.',
    },
    actionUnavailable: {
      en: 'Action unavailable',
      mk: 'Дејството не е достапно',
    },
    restrictedModalTitle: { en: 'Not allowed', mk: 'Не е дозволено' },
    restrictedModalIntro: {
      en: 'You can’t do this because your account is restricted.',
      mk: 'Не можеш да го направиш ова затоа што твојата сметка е ограничена.',
    },
    restrictedModalClose: { en: 'Close', mk: 'Затвори' },
    tryAgain: { en: 'Please try again.', mk: 'Обиди се повторно.' },
    errors: {
      description: {
        en: 'This page could not be loaded. Try again, and if it keeps happening come back a little later.',
        mk: 'Страницата не може да се вчита. Обиди се повторно, а ако продолжува, врати се малку подоцна.',
      },
      retry: { en: 'Try again', mk: 'Обиди се повторно' },
      notFoundTitle: { en: 'Page not found', mk: 'Страницата не е најдена' },
      notFoundDescription: {
        en: 'The page you’re looking for doesn’t exist, or it has moved.',
        mk: 'Страницата што ја бараш не постои или е преместена.',
      },
      backHome: { en: 'Go to the homepage', mk: 'Оди на почетната страница' },
    },
    year: (year: number): LocalizedText => ({
      en: `Year ${year}`,
      mk: `${year} година`,
    }),
    unexpectedError: { en: 'Something went wrong', mk: 'Нешто тргна наопаку' },
    apiUnavailable: {
      en: 'Scriptr is temporarily unavailable. Please try again in a moment.',
      mk: 'Scriptr е привремено недостапен. Обиди се за момент.',
    },
    signInRequired: {
      en: 'Sign in to continue.',
      mk: 'Најави се за да продолжиш.',
    },
    sessionExpired: {
      en: 'Your session expired. Please sign in and try again.',
      mk: 'Сесијата истече. Најави се и обиди се повторно.',
    },
    couldNotUpdate: (label: string): LocalizedText => ({
      en: `Couldn’t update ${label}`,
      mk: `Не успеа ажурирањето: ${label}`,
    }),
    addVote: (label: string, noun: string, count: number): LocalizedText => ({
      en: `${label} ${noun} (${count})`,
      mk: `Гласај за ${noun} (${count})`,
    }),
    removeVote: (
      label: string,
      noun: string,
      count: number
    ): LocalizedText => ({
      en: `Remove ${label.toLowerCase()} from ${noun} (${count})`,
      mk: `Отстрани го гласот од ${noun} (${count})`,
    }),
    close: { en: 'Close', mk: 'Затвори' },
    closeDialog: { en: 'Close dialog', mk: 'Затвори дијалог' },
    /** Clears whatever a field holds; the icon-only button in `InputWrapper`. */
    clearInput: { en: 'Clear input', mk: 'Исчисти полето' },
    colorTheme: { en: 'Color theme', mk: 'Тема' },
    trophyIcon: { en: 'Trophy Icon', mk: 'Икона за трофеј' },
    confirm: { en: 'Confirm', mk: 'Потврди' },
    cancel: { en: 'Cancel', mk: 'Откажи' },
    openDialog: { en: 'Open Dialog', mk: 'Отвори дијалог' },
    selectPlaceholder: { en: 'Select...', mk: 'Избери...' },
    dataUnavailable: {
      en: 'Data unavailable',
      mk: 'Податоците не се достапни',
    },
    loading: { en: 'Loading', mk: 'Се вчитува' },
    /** What Santa calls from the sleigh when it passes. */
    hoHoHo: { en: 'Ho ho ho!', mk: 'Хо хо хо!' },
    /** Names the language switch in the navbar. */
    language: { en: 'Language', mk: 'Јазик' },
    themeLight: { en: 'Light', mk: 'Ден' },
    themeAuto: { en: 'Auto', mk: 'Ауто' },
    themeDark: { en: 'Dark', mk: 'Ноќ' },
    /** Names the button that leaves the full-screen background view. */
    exitImmersive: {
      en: 'Exit full screen',
      mk: 'Излези од цел екран',
    },
  },
  flags: {
    report: { en: 'Report', mk: 'Пријави' },
    submitError: {
      en: 'Couldn’t submit report',
      mk: 'Не успеа испраќањето на пријавата',
    },
    reportSubmitted: { en: 'Report submitted', mk: 'Пријавата е испратена' },
    alreadyReportedTitle: { en: 'Already reported', mk: 'Веќе пријавено' },
    alreadyReportedDescription: {
      en: 'You already have a pending report for this item.',
      mk: 'Веќе имаш пријава на чекање за оваа ставка.',
    },
    checkStatusError: {
      en: 'Couldn’t check report status',
      mk: 'Не успеа проверката на статусот на пријавата',
    },
    reportContent: { en: 'Report', mk: 'Пријави' },
    submitted: {
      en: 'Thanks — this has been reported for review.',
      mk: 'Благодариме — пријавено е за преглед.',
    },
    description: (targetType: FlagTargetType): LocalizedText => ({
      en: `Let us know what’s wrong with this ${targetType}. Reports are reviewed by admins.`,
      mk: `Кажи ни што не е во ред со ${REPORT_TARGET_NOUN[targetType]}. Пријавите ги прегледуваат администратори.`,
    }),
    reasonPlaceholder: {
      en: 'Describe the issue (min. 10 characters)',
      mk: 'Опиши го проблемот (најмалку 10 знаци)',
    },
    reasonLabel: { en: 'Report reason', mk: 'Причина за пријава' },
    submit: { en: 'Submit report', mk: 'Испрати пријава' },
    minimumReasonLength: 10,
  },
  home: {
    greeting: { en: 'Welcome to Scriptr', mk: 'Добредојде на Scriptr' },
    metaDescription: {
      en: 'A platform for students to share and discover study materials.',
      mk: 'Платформа каде студентите делат и откриваат материјали за учење.',
    },
    title: {
      en: 'Your study, all in one place.',
      mk: 'Твојата студија, сè на едно место.',
    },
    subtitle: {
      en: 'Every university, faculty and study on Scriptr — with the scripts its students share, the subjects they take and the professors who teach them.',
      mk: 'Секој универзитет, факултет и студија на Scriptr — со скриптите што ги делат студентите, предметите што ги слушаат и професорите што ги предаваат.',
    },
    createAccount: { en: 'Create account', mk: 'Создај сметка' },
    setUpStudies: { en: 'Set up studies', mk: 'Постави студии' },
    universitiesTitle: { en: 'Universities', mk: 'Универзитети' },
    universitiesSubtitle: {
      en: 'The institutions behind every faculty and study.',
      mk: 'Институциите зад секој факултет и студија.',
    },
    facultiesTitle: { en: 'Faculties', mk: 'Факултети' },
    facultiesSubtitle: {
      en: 'The faculties that make up each university.',
      mk: 'Факултетите што го сочинуваат секој универзитет.',
    },
    studiesTitle: { en: 'Studies', mk: 'Студии' },
    studiesSubtitle: {
      en: 'Open a study to reach its subjects, professors and scripts.',
      mk: 'Отвори студија за да стигнеш до нејзините предмети, професори и скрипти.',
    },
    facultyCount: (count: number): LocalizedText => ({
      en: `${count} ${count === 1 ? 'faculty' : 'faculties'}`,
      mk: `${count} ${count === 1 ? 'факултет' : 'факултети'}`,
    }),
    facultySummary: (studies: number, professors: number): LocalizedText => ({
      en: `${studies} ${studies === 1 ? 'Study' : 'Studies'} • ${professors} ${
        professors === 1 ? 'Professor' : 'Professors'
      }`,
      mk: `${studies} ${studies === 1 ? 'студија' : 'студии'} • ${professors} ${
        professors === 1 ? 'професор' : 'професори'
      }`,
    }),
    /** The path under a study's name: its faculty, then its university. */
    studyPath: (faculty: string, university: string): LocalizedText => ({
      en: `${faculty} • ${university}`,
      mk: `${faculty} • ${university}`,
    }),
    noUniversities: {
      en: 'No universities are listed yet.',
      mk: 'Сè уште нема внесени универзитети.',
    },
    noFaculties: {
      en: 'No faculties are listed yet.',
      mk: 'Сè уште нема внесени факултети.',
    },
    noStudies: {
      en: 'No studies are open for enrolment yet.',
      mk: 'Сè уште нема отворени студии за запишување.',
    },
  },
  scripts: {
    sectionTitle: { en: 'Subject Scripts', mk: 'Скрипти по предмет' },
    sectionSubtitle: {
      en: 'Notes and study material shared by this subject community.',
      mk: 'Белешки и материјал за учење што ги споделува оваа предметна заедница.',
    },
    authoredSectionTitle: { en: 'Authored scripts', mk: 'Твои скрипти' },
    authoredSectionSubtitle: {
      en: 'Scripts shared with the community.',
      mk: 'Скрипти што ги сподели со заедницата.',
    },
    favoritesSectionTitle: { en: 'Favorite scripts', mk: 'Омилени скрипти' },
    favoritesSectionSubtitle: {
      en: 'Scripts saved for later.',
      mk: 'Скрипти зачувани за подоцна.',
    },
    searchLabel: { en: 'Search scripts', mk: 'Пребарај скрипти' },
    searchPlaceholder: {
      en: 'Search scripts by title, author, or tag...',
      mk: 'Пребарај скрипти по наслов, автор или ознака...',
    },
    emptyState: {
      en: 'No scripts match these filters.',
      mk: 'Нема скрипти што одговараат на овие филтри.',
    },
    loadFailed: {
      en: 'These scripts could not be loaded right now. Try again in a moment.',
      mk: 'Скриптите во моментов не може да се вчитаат. Обиди се повторно за момент.',
    },
    browseAll: { en: 'Browse all scripts', mk: 'Прегледај ги сите скрипти' },
    showAll: { en: 'Show all', mk: 'Прикажи ги сите' },
    // The study overview's sidebar, under the professors.
    studySidebarTitle: { en: 'Scripts', mk: 'Скрипти' },
    studySidebarSubtitle: {
      en: 'The scripts this study’s students share.',
      mk: 'Скриптите што ги споделуваат студентите на овој смер.',
    },
    studySidebarEmpty: {
      en: 'This study has no scripts yet.',
      mk: 'Овој смер сè уште нема скрипти.',
    },
    feed: {
      toggleLabel: { en: 'Script feed', mk: 'Тек на скрипти' },
      forYou: { en: 'For you', mk: 'За тебе' },
      all: { en: 'All scripts', mk: 'Сите скрипти' },
      allTitle: { en: 'All scripts', mk: 'Сите скрипти' },
      allSubtitle: {
        en: 'Top scripts from every subject in this study.',
        mk: 'Најдобрите скрипти од сите предмети во овој смер.',
      },
      // What the header search lands on: the study's own scripts, filtered by
      // the query it carried.
      searchTitle: (query: string): LocalizedText => ({
        en: `Scripts matching “${query}”`,
        mk: `Скрипти што одговараат на „${query}“`,
      }),
      searchEmpty: (query: string): LocalizedText => ({
        en: `No scripts in this study match “${query}”. Try different keywords or check the spelling.`,
        mk: `Нема скрипти во овој смер што одговараат на „${query}“. Пробај со други клучни зборови или провери го правописот.`,
      }),
      clearSearch: { en: 'Clear search', mk: 'Исчисти пребарување' },
      // The feed is a page of its own beside the study's overview, so it titles
      // itself after its content instead of repeating the study's own title.
      metadataTitle: (studyName: string): LocalizedText => ({
        en: `${studyName} · Scripts`,
        mk: `${studyName} · Скрипти`,
      }),
      metadataDescription: (studyName: string): LocalizedText => ({
        en: `The scripts students of ${studyName} share, and the subjects they cover.`,
        mk: `Скриптите што ги споделуваат студентите на ${studyName} и предметите што ги покриваат.`,
      }),
    },
    search: {
      // The global search is the catalog: universities, faculties, studies and
      // professors. Subjects and scripts belong to a study, and a study's site
      // searches its own content.
      pageTitle: { en: 'Search the catalog', mk: 'Пребарај го каталогот' },
      pageSubtitle: {
        en: 'Find a university, faculty, study or professor.',
        mk: 'Пронајди универзитет, факултет, смер или професор.',
      },
      formAriaLabel: { en: 'Search the catalog', mk: 'Пребарај го каталогот' },
      placeholder: {
        en: 'Search universities, faculties, studies or professors...',
        mk: 'Пребарај универзитети, факултети, смерови или професори...',
      },
      // On a study's own site the same bar searches that study's scripts, so it
      // names the scripts instead of the catalog.
      scriptsLabel: {
        en: 'Search scripts in this study',
        mk: 'Пребарај скрипти во овој смер',
      },
      scriptsPlaceholder: {
        en: 'Search this study’s scripts...',
        mk: 'Пребарај скрипти во овој смер...',
      },
      submit: { en: 'Search', mk: 'Пребарај' },
      resultsTitle: { en: 'Results', mk: 'Резултати' },
      resultsSubtitle: (query: string): LocalizedText => ({
        en: `Catalog entries matching “${query}”.`,
        mk: `Записи во каталогот што одговараат на „${query}“.`,
      }),
      prompt: {
        en: 'Enter a search term to find a university, faculty, study or professor.',
        mk: 'Внеси термин за пребарување за да пронајдеш универзитет, факултет, смер или професор.',
      },
      loadFailed: {
        en: 'Search is unavailable right now. Try again in a moment — your query is still in the box above.',
        mk: 'Пребарувањето во моментов е недостапно. Обиди се повторно за момент — твоето барање е сè уште во полето горе.',
      },
      noResults: (query: string): LocalizedText => ({
        en: `No catalog entries match “${query}”. Try different keywords or check the spelling.`,
        mk: `Нема записи во каталогот што одговараат на „${query}“. Пробај со други клучни зборови или провери го правописот.`,
      }),
      searchAll: (query: string): LocalizedText => ({
        en: `Search the catalog for “${query}”`,
        mk: `Пребарај го каталогот за „${query}“`,
      }),
      quickSearchLabel: { en: 'Quick search', mk: 'Брзо пребарување' },
      closeSearch: { en: 'Close search', mk: 'Затвори пребарување' },
      invalidQuery: (maxLength: number): LocalizedText => ({
        en: `Enter a search term (up to ${maxLength} characters).`,
        mk: `Внеси термин за пребарување (до ${maxLength} знаци).`,
      }),
    },
    filters: {
      allSubjects: { en: 'All subjects', mk: 'Сите предмети' },
      recentlyUpdated: { en: 'Recently updated', mk: 'Неодамна ажурирани' },
      titleAZ: { en: 'Title A-Z', mk: 'Наслов А-Ш' },
      subjectLabel: {
        en: 'Filter scripts by subject',
        mk: 'Филтрирај скрипти по предмет',
      },
      sortLabel: { en: 'Sort scripts', mk: 'Подреди скрипти' },
    },
    actions: {
      download: { en: 'Download', mk: 'Преземи' },
      preview: { en: 'Preview', mk: 'Преглед' },
      noFilesAttached: {
        en: 'No files attached to this script.',
        mk: 'Нема прикачени датотеки на оваа скрипта.',
      },
      upvote: { en: 'Upvote', mk: 'Гласај' },
      voteNoun: { en: 'script', mk: 'скриптата' },
      openScript: (author: string): LocalizedText => ({
        en: `Open ${author}'s script`,
        mk: `Отвори ја скриптата на ${author}`,
      }),
      viewComments: (title: string): LocalizedText => ({
        en: `View comments on ${title}`,
        mk: `Прикажи ги коментарите на ${title}`,
      }),
    },
    detail: {
      errorTitle: {
        en: 'Something went wrong loading this script.',
        mk: 'Нешто тргна наопаку при вчитувањето на оваа скрипта.',
      },
      errorRetry: { en: 'Try again', mk: 'Обиди се повторно' },
      notFoundTitle: { en: 'Script not found', mk: 'Скриптата не е најдена' },
      notFoundDescription: {
        en: 'This script may have been removed, or the link is incorrect.',
        mk: 'Оваа скрипта може да е отстранета или врската е неточна.',
      },
      errorFallback: { en: 'Please try again.', mk: 'Обиди се повторно.' },
    },

    uploadModal: {
      title: { en: 'Upload a script', mk: 'Прикачи скрипта' },
      triggerLabel: { en: 'New script', mk: 'Нова скрипта' },
      submitButtonLabel: { en: 'Create Script', mk: 'Создај скрипта' },
      cancelButtonLabel: { en: 'Clear', mk: 'Исчисти' },
      description: {
        en: 'Add the details your classmates need. Files are optional.',
        mk: 'Додај ги деталите што им требаат на колегите. Датотеките се изборни.',
      },
      formTitle: { en: 'Script title', mk: 'Наслов на скриптата' },
      formTitleHelp: {
        en: 'Use a clear, distinctive name — it becomes the link to your script.',
        mk: 'Користи јасно и препознатливо име — тоа станува врска до твојата скрипта.',
      },
      formDescription: { en: 'Description', mk: 'Опис' },
      formDescriptionHelp: {
        en: 'Summarize the content, coverage, or useful context.',
        mk: 'Резимирај ја содржината, што покрива или друг корисен контекст.',
      },
      // A script carries its text in one or more languages; these name the
      // selector and say which languages already hold something.
      languageLabel: { en: 'Language', mk: 'Јазик' },
      languageHelp: {
        en: 'Add at least one language. The other is optional — readers who pick it see this text instead of a translation they do not have.',
        mk: 'Додај барем еден јазик. Другиот е изборен — читателите што ќе го изберат го гледаат овој текст наместо превод што го нема.',
      },
      languageFilled: { en: 'has text', mk: 'има текст' },
      languageEmpty: { en: 'empty', mk: 'празно' },
      subjectLabel: { en: 'Subject', mk: 'Предмет' },
      professorLabel: { en: 'Professor', mk: 'Професор' },
      examSessionLabel: { en: 'Exam session', mk: 'Испитна сесија' },
      examSessionHelp: {
        en: 'Select the session this material applies to.',
        mk: 'Избери ја сесијата на која се однесува материјалот.',
      },
      examSessionPlaceholder: { en: 'Select a session', mk: 'Избери сесија' },
      generalSessionOption: {
        en: 'General (All Sessions)',
        mk: 'Општа (сите сесии)',
      },
      examYearLabel: { en: 'Exam year', mk: 'Испитна година' },
      examYearHelp: {
        en: 'Pick the session first; the years available depend on it.',
        mk: 'Прво избери сесија; достапните години зависат од неа.',
      },
      examYearPlaceholder: { en: 'Select a year', mk: 'Избери година' },
      generalYearOption: {
        en: 'General (All Years)',
        mk: 'Општа (сите години)',
      },
      additionalReadingLabel: {
        en: 'Additional reading',
        mk: 'Дополнително читање',
      },
      additionalReadingHelp: {
        en: 'Add URLs for related notes, articles, or resources.',
        mk: 'Додај врски до поврзани белешки, статии или ресурси.',
      },
      dropzoneLabel: {
        en: 'Drop files here or click to browse',
        mk: 'Префрли датотеки тука или кликни за да избереш',
      },
      filesLabel: { en: 'Files', mk: 'Датотеки' },
      filesHelp: {
        en: 'Optionally add supported files by dragging them here or browsing your device.',
        mk: 'По желба додај поддржани датотеки со префрлање тука или со избирање од уредот.',
      },
      removeButtonLabel: { en: 'Remove', mk: 'Отстрани' },
      removeLinkAriaLabel: { en: 'Remove link', mk: 'Отстрани врска' },
      removeFileAriaLabel: (name: string): LocalizedText => ({
        en: `Remove ${name}`,
        mk: `Отстрани ${name}`,
      }),
      readingLinkPlaceholder: { en: 'https://...', mk: 'https://...' },
      addLinkButtonLabel: { en: 'Add link', mk: 'Додај врска' },
      progress: {
        title: {
          en: 'Creating your script',
          mk: 'Ја создаваме твојата скрипта',
        },
        addingFilesTitle: { en: 'Adding files', mk: 'Додавање датотеки' },
        hint: {
          en: 'This can take a minute for large files. Please keep this window open.',
          mk: 'Ова може да потрае една минута за големи датотеки. Остави го прозорецот отворен.',
        },
        qualityWarning: {
          en: 'Please be aware that uploaded files may lose some visual quality, because they are compressed to fit the size limit.',
          mk: 'Имај предвид дека прикачените датотеки може да изгубат дел од визуелниот квалитет, бидејќи се компресираат за да влезат во ограничувањето на големината.',
        },
        qualityAdvice: {
          en: 'If a file is still too big afterwards, shrink it before uploading: export images at a lower resolution, or split the document into smaller files.',
          mk: 'Ако датотеката и потоа е преголема, намали ја пред прикачување: извези ги сликите со помала резолуција или подели го документот на помали датотеки.',
        },
      },
      statuses: {
        uploading: { en: 'Uploading files…', mk: 'Се прикачуваат датотеки…' },
        optimizing: {
          en: 'Optimizing files…',
          mk: 'Се оптимизираат датотеки…',
        },
        creating: { en: 'Creating script…', mk: 'Се создава скрипта…' },
        error: {
          en: 'An error occurred while creating the script.',
          mk: 'Настана грешка при создавањето на скриптата.',
        },
        success: {
          en: 'Script created successfully.',
          mk: 'Скриптата е создадена.',
        },
        successDescription: {
          en: 'Your script is now available to the subject community.',
          mk: 'Твојата скрипта сега е достапна за предметната заедница.',
        },
      },
      readingLinkErrors: {
        invalid: {
          en: 'Enter a valid link, e.g. https://example.com/notes',
          mk: 'Внеси валидна врска, на пр. https://example.com/notes',
        },
        protocol: {
          en: 'Only http:// and https:// links are allowed',
          mk: 'Дозволени се само http:// и https:// врски',
        },
        tooLong: { en: 'This link is too long', mk: 'Оваа врска е предолга' },
        duplicate: {
          en: 'This link is already in the list',
          mk: 'Оваа врска е веќе на списокот',
        },
      },
      fieldErrors: {
        titleRequired: {
          en: 'Enter a title for your script',
          mk: 'Внеси наслов за скриптата',
        },
        titleTooLong: {
          en: 'Script title must be 2 KB or less',
          mk: 'Насловот на скриптата мора да е 2 KB или помалку',
        },
        descriptionTooLong: {
          en: 'Script description must be 50 KB or less',
          mk: 'Описот на скриптата мора да е 50 KB или помалку',
        },
        unsupportedScript: {
          en: 'Use Latin or Cyrillic letters only. Other languages are not supported yet.',
          mk: 'Користи само латинични или кирилични букви. Други јазици сè уште не се поддржани.',
        },
        sessionRequired: {
          en: 'Pick an exam session, or the general one',
          mk: 'Изберете сесија или „општа“',
        },
        noProfessors: {
          en: 'No professors are available for this subject',
          mk: 'Нема достапни професори за овој предмет',
        },
        professorsUnavailable: {
          en: "This subject's professors are not linked yet, so none can be chosen",
          mk: 'Професорите на овој предмет сè уште не се поврзани, па не може да се избере ниту еден',
        },
        filesInvalid: {
          en: 'Remove or replace the files with errors',
          mk: 'Отстрани ги или замени ги датотеките со грешки',
        },
      },
      slug: {
        label: { en: 'Link', mk: 'Врска' },
        path: (slug: string) => `/scripts/${slug}`,
        /** `stem` is what the title produces; the stored slug also carries a
         * short suffix the preview cannot know before the script exists. */
        previewPath: (stem: string) => `/scripts/${stem}-…`,
        previewNote: {
          en: 'Built from the title. The last characters are added when the script is created to keep it unique.',
          mk: 'Се создава од насловот. Последните знаци се додаваат при создавањето за да остане единствена.',
        },
        fixedNote: {
          en: 'Set when the script was created and cannot be changed. Editing the title will not change it.',
          mk: 'Поставена при создавањето на скриптата и не може да се менува. Промената на насловот не ја менува.',
        },
      },

      fileErrors: {
        noFiles: {
          en: 'At least one file is required',
          mk: 'Потребна е барем една датотека',
        },
        tooMany: (max: number): LocalizedText => ({
          en: `You can upload at most ${max} files at once`,
          mk: `Можеш да прикачиш најмногу ${max} датотеки одеднаш`,
        }),
        unsupportedType: (extension: string): LocalizedText => ({
          en: `Unsupported file type (.${extension})`,
          mk: `Неподдржан тип на датотека (.${extension})`,
        }),
        tooLarge: (maxBytes: number): LocalizedText => ({
          en: `File exceeds ${toMegabytes(maxBytes)}`,
          mk: `Датотеката надминува ${toMegabytes(maxBytes)}`,
        }),
        unknownUpload: {
          en: 'This upload is unknown or has expired',
          mk: 'Ова прикачување е непознато или истечено',
        },
        invalidContent: {
          en: 'A file’s contents don’t match its file type',
          mk: 'Содржината на датотеката не одговара на нејзиниот тип',
        },
        tooLargeAfterOptimizing: (
          maxBytes: number,
          sizeBytes?: number
        ): LocalizedText =>
          sizeBytes === undefined
            ? {
                en: `A file is still over ${toMegabytes(maxBytes)} after optimizing`,
                mk: `Некоја датотека и понатаму е над ${toMegabytes(maxBytes)} по оптимизирањето`,
              }
            : {
                en: `A file is still ${toMegabytes(sizeBytes)} after optimizing (the limit is ${toMegabytes(maxBytes)})`,
                mk: `Некоја датотека и понатаму е ${toMegabytes(sizeBytes)} по оптимизирањето (ограничувањето е ${toMegabytes(maxBytes)})`,
              },
        tooLargeAfterOptimizingNamed: (
          name: string,
          maxBytes: number,
          sizeBytes: number
        ): LocalizedText => ({
          en: `${name} is still ${toMegabytes(sizeBytes)} after optimizing (the limit is ${toMegabytes(maxBytes)})`,
          mk: `${name} и понатаму е ${toMegabytes(sizeBytes)} по оптимизирањето (ограничувањето е ${toMegabytes(maxBytes)})`,
        }),
        retryTooLarge: (name: string, maxBytes: number): LocalizedText => ({
          en: `${name} was already optimized and stayed too large, so it will not fit at this size. Make it ${toMegabytes(maxBytes)} or smaller first.`,
          mk: `${name} веќе беше оптимизирана и остана преголема, па нема да се вклопи со оваа големина. Намали ја на ${toMegabytes(maxBytes)} или помалку.`,
        }),
        processingFailed: {
          en: 'Failed to process the uploaded file(s)',
          mk: 'Не успеа обработката на прикачените датотеки',
        },
        stagingFailed: {
          en: 'Failed to upload file(s)',
          mk: 'Не успеа прикачувањето на датотеките',
        },
        rateLimited: {
          en: 'Too many uploads. Please wait a few minutes and try again.',
          mk: 'Премногу прикачувања. Почекај неколку минути и обиди се повторно.',
        },
        processingUnavailable: {
          en: 'File processing is temporarily unavailable. Please try again in a few minutes.',
          mk: 'Обработката на датотеки е привремено недостапна. Обиди се повторно за неколку минути.',
        },
        invalidRequest: {
          en: 'Invalid upload request',
          mk: 'Невалидно барање за прикачување',
        },
      },
    },
  },
  subjects: {
    title: { en: 'Subjects', mk: 'Предмети' },
    searchLabel: { en: 'Search subjects', mk: 'Пребарај предмети' },
    searchPlaceholder: {
      en: 'Search subjects, codes, or professors',
      mk: 'Пребарај предмети, кодови или професори',
    },
    noSubjects: {
      en: 'No subjects are available for this study yet.',
      mk: 'Овој смер сè уште нема предмети.',
    },
    noMatchingSubjects: {
      en: 'No subjects match those filters.',
      mk: 'Нема предмети што одговараат на овие филтри.',
    },
    sidebarTitle: { en: 'Your subjects', mk: 'Твоите предмети' },
    sidebarSubtitle: {
      en: 'Subjects from your selected studies.',
      mk: 'Предмети од избраните смерови.',
    },
    emptyState: {
      en: 'Complete your study setup to see your current subjects here.',
      mk: 'Заврши го поставувањето на студиите за да ги видиш своите предмети тука.',
    },
    electiveLabel: { en: 'Elective', mk: 'Изборен' },
    filters: {
      electives: { en: 'Electives', mk: 'Изборни' },
      sortBySemester: { en: 'Semester (asc)', mk: 'Семестар (asc)' },
      sortBySemesterDesc: {
        en: 'Semester (desc)',
        mk: 'Семестар (desc)',
      },
      sortBySubject: { en: 'Sort by name', mk: 'Подреди по име' },
      sortByProfessor: { en: 'Sort by professor', mk: 'Подреди по професор' },
      filterByYear: { en: 'Filter by year', mk: 'Филтрирај по година' },
      sortSubjects: { en: 'Sort subjects', mk: 'Подреди предмети' },
    },
  },
  academics: {
    studiesTitle: { en: 'Studies', mk: 'Смерови' },
    noStudies: {
      en: 'No studies are available for this faculty yet.',
      mk: 'Овој факултет сè уште нема смерови.',
    },
    noFaculties: {
      en: 'No faculties are listed for this university yet.',
      mk: 'Овој универзитет сè уште нема наведени факултети.',
    },
    noProfessorCourses: {
      en: 'No courses are listed for this professor yet.',
      mk: 'Овој професор сè уште нема наведени предмети.',
    },
    studyImageAlt: {
      en: 'Study image',
      mk: 'Слика на смерот',
    },
    studyAbout: { en: 'About the Study', mk: 'За смерот' },
    studyOverview: { en: 'Overview', mk: 'Преглед' },
    visitWebsite: { en: 'Visit website', mk: 'Посети го сајтот' },
    location: { en: 'Location', mk: 'Локација' },
    secretary: { en: 'Secretary', mk: 'Секретар' },
    administration: { en: 'Administration', mk: 'Администрација' },
    faculties: { en: 'Faculties', mk: 'Факултети' },
    noProfessorsAssigned: {
      en: 'No professors assigned to this faculty.',
      mk: 'Овој факултет нема доделени професори.',
    },
    contactAndLocation: { en: 'Contact & Location', mk: 'Контакт и локација' },
    address: { en: 'Address', mk: 'Адреса' },
    dean: { en: 'Dean', mk: 'Декан' },
    viceDeans: { en: 'Vice Deans', mk: 'Продекани' },
    semester: (semester: number): LocalizedText => ({
      en: `Semester ${semester}`,
      mk: `Семестар ${semester}`,
    }),
    aboutFaculty: { en: 'About the faculty', mk: 'За факултетот' },
    aboutUniversity: { en: 'About the university', mk: 'За универзитетот' },
    facultyImageAlt: { en: 'Faculty image', mk: 'Слика на факултетот' },
    universityImageAlt: {
      en: 'University image',
      mk: 'Слика на универзитетот',
    },
    studySummary: (subjects: number, professors: number): LocalizedText => ({
      en: `${subjects} Subjects • ${professors} Professors`,
      mk: `${mkCount(subjects, 'предмет', 'предмети')} • ${mkCount(professors, 'професор', 'професори')}`,
    }),
    /** The student total on a faculty's or study's card. */
    studentCount: (count: number): LocalizedText => ({
      en: `${count.toLocaleString('en')} students`,
      mk: mkCount(count, 'студент', 'студенти'),
    }),
    entity: {
      university: { en: 'University', mk: 'Универзитет' },
      faculty: { en: 'Faculty', mk: 'Факултет' },
      study: { en: 'Study', mk: 'Смер' },
      professor: { en: 'Professor', mk: 'Професор' },
      subject: { en: 'Subject', mk: 'Предмет' },
    },
    professor: {
      contactDetails: { en: 'About', mk: 'Општо' },
      office: { en: 'Office', mk: 'Кабинет' },
      phone: { en: 'Phone', mk: 'Телефон' },
      email: { en: 'Email', mk: 'Е-пошта' },
      website: { en: 'Website', mk: 'Сајт' },
      affiliatedFaculties: {
        en: 'Affiliated faculties',
        mk: 'Факултети на кои предава',
      },
      biography: { en: 'Biography', mk: 'Биографија' },
      coursesTaught: {
        en: 'Courses taught',
        mk: 'Предмети што ги предава',
      },
      courseCount: (count: number): LocalizedText => ({
        en: `${count} ${count === 1 ? 'course' : 'courses'}`,
        mk: mkCount(count, 'предмет', 'предмети'),
      }),
      year: (year: number): LocalizedText => ({
        en: `Year ${year}`,
        mk: `${year} година`,
      }),
      ects: (credits: number): LocalizedText => ({
        en: `${credits} ECTS`,
        mk: `${credits} ЕКТС`,
      }),
      academicStaff: { en: 'Academic Staff', mk: 'Наставен кадар' },
      subjects: { en: 'Subjects', mk: 'Предмети' },
    },
    subject: {
      overview: { en: 'Subject overview', mk: 'Преглед на предметот' },
      curriculumDetails: {
        en: 'Curriculum details',
        mk: 'Детали за наставната програма',
      },
      viewSyllabusDocument: {
        en: 'View Syllabus Document',
        mk: 'Отвори ја наставната програма',
      },
      syllabusLabel: { en: 'Syllabus', mk: 'Наставна програма' },
      revisitPrompt: {
        en: "Use this course's shared scripts and syllabus to revisit key material in your own time.",
        mk: 'Користи ги споделените скрипти и наставната програма на овој предмет за да го повториш материјалот кога имаш време.',
      },
    },
    metadata: {
      professorDescription: (name: string): LocalizedText => ({
        en: `Academic profile, courses taught, and contact details for ${name}.`,
        mk: `Академски профил, предмети што ги предава и контакт за ${name}.`,
      }),
      universityDescription: (name: string): LocalizedText => ({
        en: `Explore faculties, departments, and academic programs at ${name}.`,
        mk: `Истражи ги факултетите, катедрите и смеровите на ${name}.`,
      }),
      facultyDescription: (name: string): LocalizedText => ({
        en: `Explore academic subjects, faculty administration, and professors at ${name}.`,
        mk: `Истражи ги предметите, администрацијата и професорите на ${name}.`,
      }),
      studyDescription: (name: string): LocalizedText => ({
        en: `Explore academic subjects, faculty administration, and professors at ${name}.`,
        mk: `Истражи ги предметите, администрацијата и професорите на ${name}.`,
      }),
      subjectDescription: (name: string): LocalizedText => ({
        en: `Syllabus, academic year, exam sessions, and course details for ${name}.`,
        mk: `Наставна програма, академска година, испитни сесии и детали за ${name}.`,
      }),
      notFoundTitle: (
        entityLabel: string,
        siteName: string
      ): LocalizedText => ({
        en: `${entityLabel} Not Found | ${siteName}`,
        mk: `Не е најдено: ${entityLabel} | ${siteName}`,
      }),
    },
  },
  editor: {
    alignText: (alignment: string): LocalizedText => ({
      en: `Align Text ${alignment}`,
      mk: `Порамнување на текстот: ${alignment}`,
    }),
    colorSwatch: (color: string): LocalizedText => ({
      en: `Color Swatch ${color}`,
      mk: `Примерок на боја ${color}`,
    }),
  },
  onboarding: {
    title: { en: 'Set up your studies', mk: 'Постави ги студиите' },
    universityTitle: {
      en: 'Which university do you attend?',
      mk: 'На кој универзитет студираш?',
    },
    facultyTitle: { en: 'Which faculty?', mk: 'На кој факултет?' },
    studyTitle: { en: 'Which study program?', mk: 'Кој смер?' },
    selectUniversityFirst: {
      en: 'Select a university first.',
      mk: 'Прво избери универзитет.',
    },
    selectFacultyFirst: {
      en: 'Select a faculty first.',
      mk: 'Прво избери факултет.',
    },
    selectStudyFirst: {
      en: 'Select a study to see subjects.',
      mk: 'Избери смер за да ги видиш предметите.',
    },
    noOptions: { en: 'No options available yet.', mk: 'Сè уште нема опции.' },
    noSubjects: {
      en: 'No subjects found for this study yet.',
      mk: 'Овој смер сè уште нема предмети.',
    },
    subjectsTitle: {
      en: 'Which years have you finished?',
      mk: 'Кои години ги имаш завршено?',
    },
    subjectsSubtitle: {
      en: 'Mark a whole year done at once, or check off individual subjects below — fine-tune this later from your profile too.',
      mk: 'Означи цела година одеднаш или штиклирај поединечни предмети подолу — можеш да го дотераш подоцна и од профилот.',
    },
    subjectCount: (completed: number, total: number): LocalizedText => ({
      en: `${completed}/${total} subjects done`,
      mk: `${completed}/${total} ${total % 10 === 1 && total % 100 !== 11 ? 'предмет завршен' : 'предмети завршени'}`,
    }),
    /** Compact progress for the narrow year header. */
    subjectCountShort: (completed: number, total: number): LocalizedText => ({
      en: `${completed}/${total}`,
      mk: `${completed}/${total}`,
    }),
    requiredSubjects: { en: 'Required', mk: 'Задолжителни' },
    electiveSubjects: { en: 'Electives', mk: 'Изборни' },
    yearCompleted: { en: 'Done', mk: 'Завршена' },
    markYearComplete: {
      en: 'Mark year complete',
      mk: 'Означи ја годината за завршена',
    },
    continue: { en: 'Continue', mk: 'Продолжи' },
    saving: { en: 'Saving…', mk: 'Се зачувува…' },
    saveFailed: {
      en: 'We could not save your academic profile. Please try again.',
      mk: 'Не можевме да го зачуваме твојот академски профил. Обиди се повторно.',
    },
    catalogLoading: {
      en: 'Loading your studies…',
      mk: 'Ги вчитуваме твоите студии…',
    },
    catalogFailed: {
      en: `We couldn't load your studies. Please try again.`,
      mk: 'Не можевме да ги вчитаме твоите студии. Обиди се повторно.',
    },
    retry: { en: 'Try again', mk: 'Обиди се повторно' },
    resumeReminder: {
      title: {
        en: 'Finish setting up your studies',
        mk: 'Доврши го поставувањето на студиите',
      },
      body: {
        en: 'Pick up where you left off any time.',
        mk: 'Продолжи од каде застана кога сакаш.',
      },
      action: { en: 'Resume setup', mk: 'Продолжи со поставување' },
    },
    studySelection: {
      /** The line above the heading: what the page is for, in three words. */
      greeting: { en: 'Let’s get you set up', mk: 'Да го наместиме тоа' },
      title: { en: 'Choose your study', mk: 'Избери смер' },
      subtitle: {
        en: 'Pick the university, faculty and study you attend. You can add another study later.',
        mk: 'Избери универзитет, факултет и смерот што го посетуваш. Друг можеш да додадеш подоцна.',
      },
      empty: {
        en: 'No studies are open for enrolment yet.',
        mk: 'Сè уште нема отворени студии за запишување.',
      },
      /** Followed by the `alreadyAddedEdit` link. */
      alreadyAdded: {
        en: 'Study already set up —',
        mk: 'Овој смер е веќе поставен —',
      },
      alreadyAddedEdit: { en: 'edit it here', mk: 'уреди го тука' },
    },
    academicSetup: {
      /** The line above the heading: three words on the effort, since the
       * heading already says what the page does. */
      greeting: {
        en: 'Takes about a minute',
        mk: 'Трае околу една минута',
      },
      title: {
        en: 'Set up your academic profile',
        mk: 'Постави академски профил',
      },
      /** A signed-in reader who is already a member of this study is changing
       * the profile it holds, not creating one. */
      updateTitle: {
        en: 'Edit academic profile',
        mk: 'Уреди академски профил',
      },
      subtitle: (studyName: string): LocalizedText => ({
        en: `Which years of ${studyName} have you finished? This only affects what you see here — you can change it later from your profile.`,
        mk: `Кои години од ${studyName} ги заврши? Ова влијае само на тоа што го гледаш тука — можеш да го смениш подоцна од профилот.`,
      }),
      submit: { en: 'Save and continue', mk: 'Зачувај и продолжи' },
      /** The same submit, when it is an update rather than a first setup. */
      saveChanges: { en: 'Save changes', mk: 'Зачувај промени' },
      saved: {
        en: 'Your academic profile is saved.',
        mk: 'Твојот академски профил е зачуван.',
      },
      /** The way to the catalog picker, which is the only route to another
       * study's setup from inside one. */
      setupAnother: {
        en: 'Set up another study',
        mk: 'Постави друг смер',
      },
      skip: { en: 'Skip for now', mk: 'Прескокни засега' },
      resume: { en: 'Finish setting up', mk: 'Доврши го поставувањето' },
      resumeTitle: {
        en: 'Your setup is not finished',
        mk: 'Поставувањето не е завршено',
      },
      resumeBody: {
        en: 'Mark the years you have finished to see what is left to take.',
        mk: 'Означи ги годините што си ги завршил за да видиш што ти останува.',
      },
      guestNote: {
        en: 'Without an account this lives only in this browser. Create an account to keep it on every device.',
        mk: 'Без сметка, ова живее само во овој прелистувач. Создај сметка за да го имаш на секој уред.',
      },
      noSubjects: {
        en: 'This study has no subjects synced to the database yet.',
        mk: 'Овој смер сè уште нема предмети синхронизирани со базата.',
      },
      notSynced: {
        en: 'This study is not linked to the database yet, so setup is unavailable.',
        mk: 'Овој смер сè уште не е поврзан со базата, па поставувањето е недостапно.',
      },
    },
    account: {
      title: { en: 'Save your progress', mk: 'Зачувај го напредокот' },
      subtitle: {
        en: 'Without an account, this only lives in this browser. Create an account to keep it synced across your devices.',
        mk: 'Без сметка, ова живее само во овој прелистувач. Создај сметка за да го имаш синхронизирано на сите уреди.',
      },
      continueAsGuest: {
        en: 'Continue as guest',
        mk: 'Продолжи како гостин',
      },
      createAccount: { en: 'Create an account', mk: 'Создај сметка' },
    },
  },
  profile: {
    universities: { en: 'Universities', mk: 'Универзитети' },
    faculties: { en: 'Faculties', mk: 'Факултети' },
    studies: { en: 'Studies', mk: 'Смерови' },
    noAcademicAffiliations: {
      en: 'No academic affiliations added.',
      mk: 'Нема додадени академски припадности.',
    },
    loadingLabel: {
      en: 'Loading your profile…',
      mk: 'Го вчитуваме твојот профил…',
    },
    loadError: {
      en: `We couldn't load your profile. Please try again.`,
      mk: 'Не можевме да го вчитаме твојот профил. Обиди се повторно.',
    },
    editProfileLabel: { en: 'Edit profile', mk: 'Уреди профил' },
    retryLabel: { en: 'Try again', mk: 'Обиди се повторно' },
    greeting: { en: 'Profile', mk: 'Профил' },
    viewProfileAriaLabel: {
      en: 'Go to your profile',
      mk: 'Оди на твојот профил',
    },
    subjects: {
      statusGroupLabel: { en: 'Subject status', mk: 'Статус на предметите' },
      completed: { en: 'Completed', mk: 'Завршени' },
      currentlyTaking: { en: 'Currently taking', mk: 'Во тек' },
      completedSubtitle: {
        en: 'Subjects completed so far.',
        mk: 'Досега завршени предмети.',
      },
      currentlyTakingSubtitle: {
        en: 'Subjects still in progress.',
        mk: 'Предмети што сè уште ги слушаш.',
      },
      completedEmpty: {
        en: 'No completed subjects yet.',
        mk: 'Сè уште нема завршени предмети.',
      },
      currentlyTakingEmpty: {
        en: 'No subjects in progress.',
        mk: 'Нема предмети во тек.',
      },
      studyFilterLabel: {
        en: 'Filter by study',
        mk: 'Филтрирај по смер',
      },
      allStudies: { en: 'All studies', mk: 'Сите смерови' },
    },
    academics: {
      editLabel: {
        en: 'Edit academics',
        mk: 'Уреди академски податоци',
      },
      title: { en: 'Edit academics', mk: 'Уреди академски податоци' },
      sectionTitle: { en: 'Academics', mk: 'Академски податоци' },
      notPrepared: {
        en: 'Your academic selections could not be prepared. Please review them and try again.',
        mk: 'Твоите академски избори не можеа да се подготват. Прегледај ги и обиди се повторно.',
      },
      saved: {
        en: 'Academics updated',
        mk: 'Академските податоци се ажурирани',
      },
      saveFailed: {
        en: `We couldn't update your academics`,
        mk: 'Не можевме да ги ажурираме академските податоци',
      },
    },
    edit: {
      title: { en: 'Edit profile', mk: 'Уреди профил' },
      fullNameLabel: { en: 'Full name', mk: 'Име и презиме' },
      usernameLabel: { en: 'Username', mk: 'Корисничко име' },
      cancel: { en: 'Cancel', mk: 'Откажи' },
      save: { en: 'Save changes', mk: 'Зачувај промени' },
      saved: { en: 'Profile updated', mk: 'Профилот е ажуриран' },
      saveFailed: {
        en: `We couldn't update your profile`,
        mk: 'Не можевме да го ажурираме профилот',
      },
      avatarLabel: { en: 'Profile photo', mk: 'Профилна фотографија' },
      avatarChange: { en: 'Change photo', mk: 'Смени фотографија' },
      avatarInvalidType: {
        en: 'Choose a JPEG, PNG, or WebP image.',
        mk: 'Избери JPEG, PNG или WebP слика.',
      },
      avatarTooLarge: (maxMegabytes: number): LocalizedText => ({
        en: `Choose an image under ${maxMegabytes} MB.`,
        mk: `Избери слика помала од ${maxMegabytes} MB.`,
      }),
      avatarUploadUnavailable: {
        en: 'Photo upload is not available yet.',
        mk: 'Прикачувањето фотографија сè уште не е достапно.',
      },
    },
  },
  footer: {
    copyright: (year: number): LocalizedText => ({
      en: `© ${year} All rights reserved.`,
      mk: `© ${year} Сите права задржани.`,
    }),
  },
  navigation: {
    account: { en: 'Account', mk: 'Сметка' },
    home: { en: 'Home', mk: 'Дома' },
    api: { en: 'API', mk: 'API' },
    auth: { en: 'Auth', mk: 'Најава' },
    subjects: { en: 'Subjects', mk: 'Предмети' },
    scripts: { en: 'Scripts', mk: 'Скрипти' },
    studies: { en: 'Your studies', mk: 'Твоите студии' },
    professors: { en: 'Professors', mk: 'Професори' },
    workspace: { en: 'Workspace', mk: 'Работен простор' },
    favorites: { en: 'Favorites', mk: 'Омилени' },
    favoritesShowAll: {
      en: 'Show all favorites',
      mk: 'Прикажи ги сите омилени',
    },
    comments: { en: 'Comments', mk: 'Коментари' },
    newScript: { en: 'New script', mk: 'Нова скрипта' },
    notifications: { en: 'Notifications', mk: 'Известувања' },
    signIn: { en: 'Sign in', mk: 'Најави се' },
    closeNavigation: { en: 'Close navigation', mk: 'Затвори навигација' },
    simpleMode: { en: 'Simple mode', mk: 'Едноставно' },
    simpleModeDescription: {
      en: 'Turns off transparency, animations and the animated background.',
      mk: 'Исклучува проѕирност, анимации и анимираната позадина.',
    },
    openNavigation: { en: 'Open navigation', mk: 'Отвори навигација' },
    mainNavigation: { en: 'Main navigation', mk: 'Главна навигација' },
    studyTip: { en: 'Study tip', mk: 'Совет за учење' },
    /** The academic week beside the header's date. */
    week: (week: number): LocalizedText => ({
      en: `Week ${week}`,
      mk: `Недела ${week}`,
    }),
  },
  activity: {
    title: { en: 'Your activity', mk: 'Твојата активност' },
    savedScripts: { en: 'Saved scripts', mk: 'Зачувани скрипти' },
    scriptsAuthored: { en: 'Scripts authored', mk: 'Напишани скрипти' },
    helpfulComments: { en: 'Helpful comments', mk: 'Корисни коментари' },
  },
  auth: {
    subtitle: {
      en: 'Access your academic subjects, saved scripts, and study materials.',
      mk: 'Пристапи до своите предмети, зачувани скрипти и материјали за учење.',
    },
    loadingLabel: {
      en: 'Checking your session…',
      mk: 'Ја проверуваме сесијата…',
    },
    signedInTitle: { en: "You're signed in", mk: 'Најавен си' },
    signedInLabel: { en: 'Signed in as', mk: 'Најавен како' },
    continueLabel: { en: 'Continue to Scriptr', mk: 'Продолжи кон Scriptr' },
    continueAsGuestLabel: {
      en: 'Continue as Guest',
      mk: 'Продолжи како гостин',
    },
    logoutButtonLabel: { en: 'Log out', mk: 'Одјави се' },
    login: {
      title: { en: 'Sign in to Scriptr', mk: 'Најави се на Scriptr' },
      emailLabel: { en: 'Email', mk: 'Е-пошта' },
      passwordLabel: { en: 'Password', mk: 'Лозинка' },
      submitButtonLabel: { en: 'Sign in', mk: 'Најави се' },
      switchToRegister: {
        en: "Don't have an account? Create one",
        mk: 'Немаш сметка? Создај ја',
      },
      statuses: {
        submitting: { en: 'Signing in…', mk: 'Те најавуваме…' },
        errorTitle: { en: 'Sign-in failed', mk: 'Најавувањето не успеа' },
        successTitle: { en: 'Signed in', mk: 'Најавен си' },
        successDescription: { en: 'Welcome back.', mk: 'Добредојде назад.' },
      },
    },
    register: {
      title: { en: 'Create your account', mk: 'Создај ја својата сметка' },
      fullNameLabel: { en: 'Full name', mk: 'Име и презиме' },
      usernameLabel: { en: 'Username', mk: 'Корисничко име' },
      emailLabel: { en: 'Email', mk: 'Е-пошта' },
      passwordLabel: { en: 'Password', mk: 'Лозинка' },
      submitButtonLabel: { en: 'Create account', mk: 'Создај сметка' },
      switchToLogin: {
        en: 'Already have an account? Sign in',
        mk: 'Веќе имаш сметка? Најави се',
      },
      fieldErrors: {
        usernameTaken: {
          en: 'This username is already taken',
          mk: 'Ова корисничко име е веќе зафатено',
        },
        emailTaken: {
          en: 'An account with this email already exists',
          mk: 'Веќе постои сметка со оваа е-пошта',
        },
      },
      statuses: {
        submitting: {
          en: 'Creating your account…',
          mk: 'Ја создаваме твојата сметка…',
        },
        errorTitle: {
          en: 'Could not create account',
          mk: 'Не успеа создавањето на сметката',
        },
        successTitle: { en: 'Account created', mk: 'Сметката е создадена' },
        successDescription: {
          en: 'Welcome to Scriptr.',
          mk: 'Добредојде на Scriptr.',
        },
        incompleteForm: {
          en: 'Please complete the form correctly.',
          mk: 'Пополни го формуларот правилно.',
        },
      },
    },
    callback: {
      processingLabel: { en: 'Signing you in…', mk: 'Те најавуваме…' },
      backToSignIn: { en: 'Back to sign in', mk: 'Назад на најава' },
      invalidLink: {
        en: 'This link is missing or invalid.',
        mk: 'Оваа врска недостасува или не е валидна.',
      },
    },
  },
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const UI_STRINGS = getStrings(UI_STRINGS_PACK, DEFAULT_LOCALE)
