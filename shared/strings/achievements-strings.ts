import type { AchievementRarity } from '../config/achievements'
import { DEFAULT_LOCALE } from '../config/localization-constants'
import type { LocalizedText } from '../types/localization.types'
import { getStrings } from '../utils/localized-strings'

/** Badge copy. A rarity label is an adjective agreeing with "achievement", so
 * the Macedonian forms are neuter. `ACHIEVEMENTS_STRINGS` at the bottom is the
 * English view for call sites that have not adopted `useStrings` yet. */
export const ACHIEVEMENTS_STRINGS_PACK = {
  groupLabel: { en: 'Achievements', mk: 'Достигнувања' },
  rarity: {
    common: { en: 'Common', mk: 'Често' },
    uncommon: { en: 'Uncommon', mk: 'Необично' },
    rare: { en: 'Rare', mk: 'Ретко' },
    epic: { en: 'Epic', mk: 'Епско' },
    legendary: { en: 'Legendary', mk: 'Легендарно' },
  } as const satisfies Record<AchievementRarity, LocalizedText>,
  badgeLabel: (title: string, rarityLabel: string): LocalizedText => ({
    en: `${title}, ${rarityLabel} achievement`,
    mk: `${title}, ${rarityLabel} достигнување`,
  }),
  /** The count on a stacked badge; the rest of the type is in its tray. */
  stackCount: (hidden: number): LocalizedText => ({
    en: `+${hidden}`,
    mk: `+${hidden}`,
  }),
  stackLabel: (title: string, hidden: number): LocalizedText => ({
    en: `${title}, ${hidden} more like it`,
    mk: `${title}, уште ${hidden} слични`,
  }),
  earnedOn: (date: string): LocalizedText => ({
    en: `Earned on ${date}`,
    mk: `Освоено на ${date}`,
  }),
  /** The heading above platform-wide badges, when a study's badges sit beside
   * them. A study scope is headed by the study's own name. */
  scopeGlobal: { en: 'Platform-wide', mk: 'Низ целата платформа' },
  earnedIn: (studyName: string): LocalizedText => ({
    en: `Earned in ${studyName}`,
    mk: `Освоено во ${studyName}`,
  }),
  rarityLabel: { en: `Rarity: `, mk: `Реткост: ` },
  /** Display copy for the seeded achievements, keyed by
   * `achievement_definitions.id`. `ACHIEVEMENT_COPY` in
   * `shared/config/achievements.ts` is the English view of this, so a wording
   * change still reaches the badge, the admin list and the notification at
   * once. Definitions created through the admin screen have no entry here and
   * fall back to the row they were saved with. */
  copy: {
    // scripts_uploaded
    first_upload: {
      title: { en: 'Fresh Off the Press', mk: 'Топло од печатница' },
      description: {
        en: 'Your first script is out in the wild. Somebody is about to study from it.',
        mk: 'Првата скрипта ти е надвор. Некој наскоро ќе учи од неа.',
      },
    },
    script_stack: {
      title: { en: 'Starter Stack', mk: 'Почетна колекција' },
      description: {
        en: 'Three scripts in. The collection has officially begun.',
        mk: 'Три скрипти. Колекцијата официјално почна.',
      },
    },
    prolific_uploader: {
      title: { en: 'Script Hoarder', mk: 'Собирач на скрипти' },
      description: {
        en: 'Ten scripts shared. Your folder is turning into a library.',
        mk: 'Десет споделени скрипти. Папката ти станува библиотека.',
      },
    },
    syllabus_keeper: {
      title: { en: 'Syllabus Keeper', mk: 'Чувар на програмата' },
      description: {
        en: 'Twenty-five scripts shared — the whole semester is archived for the next generation.',
        mk: 'Дваесет и пет скрипти — целиот семестар е архивиран за идната генерација.',
      },
    },
    library_of_scriptr: {
      title: { en: 'Library of Scriptr', mk: 'Библиотека на Scriptr' },
      description: {
        en: 'Fifty scripts shared. You are essentially the faculty archive now.',
        mk: 'Педесет споделени скрипти. Практично си архивата на факултетот.',
      },
    },
    // comments_posted
    first_word: {
      title: { en: 'First Word', mk: 'Прв збор' },
      description: {
        en: 'You broke the silence with a comment.',
        mk: 'Го прекина молкот со коментар.',
      },
    },
    study_buddy: {
      title: { en: 'Study Buddy', mk: 'Другар за учење' },
      description: {
        en: "Ten comments. Somebody's question got answered because of you.",
        mk: 'Десет коментари. Нечие прашање доби одговор поради тебе.',
      },
    },
    active_commenter: {
      title: { en: 'Thread Goblin', mk: 'Дух од дискусијата' },
      description: {
        en: 'Twenty-five comments. You basically live in the discussion at this point.',
        mk: 'Дваесет и пет коментари. Во дискусијата живееш.',
      },
    },
    seminar_speaker: {
      title: { en: 'Seminar Speaker', mk: 'Семинарски говорник' },
      description: {
        en: 'A hundred comments. The discussion tends to start with you.',
        mk: 'Сто коментари. Дискусијата обично почнува со тебе.',
      },
    },
    voice_of_the_faculty: {
      title: { en: 'Voice of the Faculty', mk: 'Глас на факултетот' },
      description: {
        en: 'Two hundred and fifty comments. Yours is the answer everyone waits for.',
        mk: 'Двесте и педесет коментари. Твојот е одговорот што сите го чекаат.',
      },
    },
    // total_script_votes
    seal_of_approval: {
      title: { en: 'Seal of Approval', mk: 'Печат на одобрување' },
      description: {
        en: "Your first upvote landed. Validation tastes good, doesn't it?",
        mk: 'Првиот глас за тебе. Потврдата прија, нели?',
      },
    },
    crowd_pleaser: {
      title: { en: 'Crowd Pleaser', mk: 'Љубимец на публиката' },
      description: {
        en: 'Ten votes across your scripts. The crowd is paying attention.',
        mk: 'Десет гласови на твоите скрипти. Публиката внимава.',
      },
    },
    popular_creator: {
      title: { en: 'Vote Magnet', mk: 'Магнет за гласови' },
      description: {
        en: 'Fifty votes across your scripts. People go looking for your notes now.',
        mk: 'Педесет гласови на твоите скрипти. Луѓето веќе ги бараат твоите белешки.',
      },
    },
    campus_legend: {
      title: { en: 'Campus Legend', mk: 'Легенда на кампусот' },
      description: {
        en: 'Two hundred and fifty votes. Your scripts are basically folklore now.',
        mk: 'Двесте и педесет гласови. Твоите скрипти се веќе легенда.',
      },
    },
    script_royalty: {
      title: { en: 'Script Royalty', mk: 'Крал на скриптите' },
      description: {
        en: 'A thousand votes across your scripts. They have their own fan club at this point.',
        mk: 'Илјада гласови на твоите скрипти. Веќе имаат свој фан-клуб.',
      },
    },
    // total_script_downloads
    someone_noticed: {
      title: { en: 'Someone Noticed', mk: 'Некој забележа' },
      description: {
        en: 'Your script was downloaded for the first time.',
        mk: 'Твојата скрипта е преземена за прв пат.',
      },
    },
    in_demand: {
      title: { en: 'In Demand', mk: 'Голема побарувачка' },
      description: {
        en: 'Ten downloads. Study groups are passing your notes around.',
        mk: 'Десет преземања. Групите за учење ги делат твоите белешки.',
      },
    },
    exam_season_hero: {
      title: { en: 'Exam Season Hero', mk: 'Херој на испитната сесија' },
      description: {
        en: "A hundred downloads — you are somebody's last-minute rescue.",
        mk: 'Сто преземања — некому си спас во последен момент.',
      },
    },
    viral_syllabus: {
      title: { en: 'Viral Syllabus', mk: 'Вирусна програма' },
      description: {
        en: 'Five hundred downloads. Half the faculty has a copy by now.',
        mk: 'Петстотини преземања. Половина факултет има копија.',
      },
    },
    greatest_hits: {
      title: { en: 'Greatest Hits', mk: 'Најголеми хитови' },
      description: {
        en: 'Two thousand downloads. Somewhere, a printing press is jealous.',
        mk: 'Две илјади преземања. Некаде, една печатница ти завидува.',
      },
    },
  },
} as const

/** English view for call sites that have not adopted `useStrings` yet. */
export const ACHIEVEMENTS_STRINGS = getStrings(
  ACHIEVEMENTS_STRINGS_PACK,
  DEFAULT_LOCALE
)
