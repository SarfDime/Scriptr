import { at, defineMigration, patch, set, unset } from 'sanity/migrate'

/**
 * A study tip's body used to be a single-language `content` field while only
 * the title was localized, so the tip a Macedonian reader saw was half
 * translated. This moves each body into `localizedContent` (English into `en`,
 * untouched) and writes the Macedonian half of both fields.
 *
 * The translations live here rather than in the Studio because there are ten of
 * them and they shipped with the site: one place to review, and a re-run does no
 * harm — `en` is only seeded when the localized object is missing, and `mk` is
 * written again with the same text.
 */
const TRANSLATIONS: Record<string, { title: string; content: string }> = {
  '1c8c94ab-e79a-4aaa-8c95-6cae92db4df1': {
    title: 'Стари испити навреме',
    content:
      'Решавај стари испити со ограничено време уште пред испитот, не само ноќта пред него. Така гледаш како се поставуваат прашањата и што уште не ти е јасно.',
  },
  '26a1b1d8-be0c-4571-b6da-f87e5a9a3418': {
    title: 'Планирај вечерва за утре',
    content:
      'Ноќта пред тоа запиши ги трите работи што ќе ги учиш утре и кога. Конкретен план вреди повеќе од нејасна намера да учиш.',
  },
  '49c1e3ae-b153-499d-a05c-f80ba6cc8432': {
    title: 'Мешај типови задачи',
    content:
      'Во едно учење мешај различни типови задачи наместо многу исти. Изгледа потешко, но учиш да го избереш вистинскиот метод, а не само да повторуваш еден.',
  },
  '5a312464-020d-42bf-994f-bdc7ae181ce8': {
    title: 'Објасни гласно',
    content:
      'Објасни го поимот гласно, со едноставни зборови, како да му објаснуваш на другар. Онаму каде што ќе се сопнеш е делот што уште не си го разбрал.',
  },
  '5f966f35-598a-4311-ad54-349cab116737': {
    title: 'Учи на интервали',
    content:
      'Распореди го учењето на неколку дена наместо едно долго седење. Враќањето на материјалот по пауза го задржува многу подолго од набивање пред испит.',
  },
  '6d61773e-d32b-40f6-9754-235d28cfecbf': {
    title: 'Повторувај од памет',
    content:
      'Затвори ги белешките и запиши сè што паметиш за темата, потоа провери што си испуштил. Вадењето од памет е подобро од препрочитување.',
  },
  '98cd59a0-e656-43f6-8dec-9c417058d521': {
    title: 'Врати се на грешките',
    content:
      'Поминувај најмногу време на она што си го згрешил, не на она што веќе го знаеш. Води кратка листа на грешки и прегледај ја пред испитот.',
  },
  'cea6dd4c-3a46-4e51-90d4-78f75906d019': {
    title: 'Најтешкото прво',
    content:
      'Почни со најтешкиот предмет додека имаш најмногу енергија, а полесното повторување остави го за подоцна во денот.',
  },
  'd313f623-8601-4f0f-ac01-ba9abbba0544': {
    title: 'Фокусирани блокови',
    content:
      'Учи во фокусирани блокови од 25 до 50 минути со кратка пауза по секој. Телефонот нека биде подалеку додека не истече тајмерот.',
  },
  'e250d9b5-141f-4654-be20-9871e472f1de': {
    title: 'Сон',
    content:
      'Спиењето е дел од учењето, зашто помага да се затврди наученото. Цела ноќ сон пред испит обично е подобар од учење до последен момент.',
  },
}

/** One paragraph of rich text, the shape the schema's `richTextLite` accepts. */
const richText = (text: string) => [
  {
    _type: 'block',
    _key: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
        text,
        marks: [],
      },
    ],
  },
]

export default defineMigration({
  title: 'Localize a study tip’s body and translate the tips',
  documentTypes: ['studyTip'],

  migrate: {
    document(document) {
      const translation = TRANSLATIONS[document._id]
      if (!translation) return undefined

      const patches = []
      const localizedContent = document.localizedContent as
        | Record<string, unknown>
        | undefined

      // Only seed `en` when the object is missing: a filled English body is the
      // authors' text, not this migration's.
      if (!localizedContent && document.content) {
        patches.push(
          at(
            'localizedContent',
            set({ _type: 'localizedRichTextLite', en: document.content })
          )
        )
      }

      patches.push(
        at('localizedContent.mk', set(richText(translation.content))),
        at('localizedTitle.mk', set(richText(translation.title)))
      )

      if ('content' in document) patches.push(at('content', unset()))

      return patch(document._id, patches)
    },
  },
})
