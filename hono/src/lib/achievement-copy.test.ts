import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ACHIEVEMENT_COPY,
  getAchievementCopy,
} from '../../../shared/config/achievements'
import {
  ACHIEVEMENT_DESCRIPTION_MAX_LENGTH,
  ACHIEVEMENT_TITLE_MAX_LENGTH,
  ACHIEVEMENT_TITLE_MIN_LENGTH,
} from '../../../shared/utils/achievement-definition.utils'

/** Every seeded achievement renders from the shared catalogue, so a missing or
 * malformed entry would surface as a raw id in a badge or a notification. */
const SEEDED_IDS = [
  'first_upload',
  'script_stack',
  'prolific_uploader',
  'syllabus_keeper',
  'library_of_scriptr',
  'first_word',
  'study_buddy',
  'active_commenter',
  'seminar_speaker',
  'voice_of_the_faculty',
  'seal_of_approval',
  'crowd_pleaser',
  'popular_creator',
  'campus_legend',
  'script_royalty',
  'someone_noticed',
  'in_demand',
  'exam_season_hero',
  'viral_syllabus',
  'greatest_hits',
]

describe('achievement copy catalogue', () => {
  it('covers every seeded achievement', () => {
    for (const id of SEEDED_IDS) {
      assert.ok(ACHIEVEMENT_COPY[id], `${id} has no catalogue entry`)
    }
  })

  it('has non-empty copy inside the DB limits', () => {
    for (const [id, copy] of Object.entries(ACHIEVEMENT_COPY)) {
      // The DB still CHECKs these, and the row keeps a copy of the text.
      assert.ok(
        copy.title.length >= ACHIEVEMENT_TITLE_MIN_LENGTH &&
          copy.title.length <= ACHIEVEMENT_TITLE_MAX_LENGTH,
        id
      )
      assert.ok(
        copy.description.length > 0 &&
          copy.description.length <= ACHIEVEMENT_DESCRIPTION_MAX_LENGTH,
        id
      )
    }
  })

  it('prefers the catalogue over the stored row', () => {
    const copy = getAchievementCopy('first_upload', {
      title: 'Stale database title',
      description: 'Stale database description',
    })
    assert.equal(copy.title, ACHIEVEMENT_COPY.first_upload?.title)
    assert.equal(copy.description, ACHIEVEMENT_COPY.first_upload?.description)
  })

  it('falls back to the stored row for definitions created in the admin UI', () => {
    assert.deepEqual(
      getAchievementCopy('made_in_admin', {
        title: 'Made in admin',
        description: 'Typed in the form',
      }),
      { title: 'Made in admin', description: 'Typed in the form' }
    )
    assert.deepEqual(getAchievementCopy('made_in_admin', { title: null }), {
      title: 'made_in_admin',
      description: null,
    })
    assert.deepEqual(getAchievementCopy('made_in_admin'), {
      title: 'made_in_admin',
      description: null,
    })
  })
})
