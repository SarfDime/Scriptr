import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGLISH_LOCALE,
  MACEDONIAN_LOCALE,
} from '../config/localization-constants'
import {
  resolveStoredNotificationCopy,
  type StoredNotificationRow,
} from './notification-copy'

const row = (
  type: string,
  data: unknown,
  overrides: Partial<StoredNotificationRow> = {}
): StoredNotificationRow => ({
  type,
  title: 'Stored title',
  body: 'Stored body',
  data,
  ...overrides,
})

describe('resolveStoredNotificationCopy', () => {
  it('spells an achievement out from the catalogue, in either language', () => {
    const earned = row('achievement_earned', { achievement_id: 'first_upload' })

    assert.deepEqual(resolveStoredNotificationCopy(earned, ENGLISH_LOCALE), {
      title: 'Achievement unlocked: Fresh Off the Press',
      body: 'Your first script is out in the wild. Somebody is about to study from it.',
    })
    assert.deepEqual(resolveStoredNotificationCopy(earned, MACEDONIAN_LOCALE), {
      title: 'Ново достигнување: Топло од печатница',
      body: 'Првата скрипта ти е надвор. Некој наскоро ќе учи од неа.',
    })
  })

  it('keeps the stored text for an achievement the catalogue does not know', () => {
    const earned = row('achievement_earned', {
      achievement_id: 'made_in_admin',
    })

    assert.deepEqual(resolveStoredNotificationCopy(earned, MACEDONIAN_LOCALE), {
      title: 'Stored title',
      body: 'Stored body',
    })
  })

  it('rebuilds a restriction from its reason', () => {
    const applied = row('restriction_applied', {
      reason: 'Spam',
      expires_at: null,
    })

    assert.deepEqual(
      resolveStoredNotificationCopy(applied, MACEDONIAN_LOCALE),
      {
        title: 'Изречено ограничување на сметката',
        body: 'Причина: Spam. Ограничувањето е трајно.',
      }
    )
    assert.equal(
      resolveStoredNotificationCopy(applied, ENGLISH_LOCALE).body,
      'Reason: Spam. This restriction is permanent.'
    )
  })

  it('mentions the expiry when the restriction has one', () => {
    const applied = row('restriction_applied', {
      reason: 'Spam',
      expires_at: '2026-12-01T00:00:00.000Z',
    })

    // The date is formatted for the reader's machine, so only the sentence
    // around it is asserted.
    assert.match(
      resolveStoredNotificationCopy(applied, MACEDONIAN_LOCALE).body ?? '',
      /^Причина: Spam\. Ограничувањето трае до /
    )
  })

  it('falls back to the stored row when a restriction has no reason', () => {
    const applied = row('restriction_applied', { expires_at: null })

    assert.deepEqual(
      resolveStoredNotificationCopy(applied, MACEDONIAN_LOCALE),
      { title: 'Stored title', body: 'Stored body' }
    )
  })

  it('rebuilds a lifted restriction, which needs no arguments', () => {
    assert.deepEqual(
      resolveStoredNotificationCopy(
        row('restriction_lifted', null),
        MACEDONIAN_LOCALE
      ),
      {
        title: 'Укинато ограничување на сметката',
        body: 'Администратор го укина ограничувањето на твојата сметка.',
      }
    )
  })

  it('names the removed content and what it was', () => {
    const removed = row('content_removed', {
      target_kind: 'comment',
      title: 'Алгебра 1',
    })

    assert.deepEqual(
      resolveStoredNotificationCopy(removed, MACEDONIAN_LOCALE),
      {
        title: 'Отстранета содржина: Алгебра 1',
        body: 'Администратор ти отстрани коментар.',
      }
    )
    assert.equal(
      resolveStoredNotificationCopy(removed, ENGLISH_LOCALE).body,
      'An administrator removed your comment.'
    )
  })

  it('keeps the stored row when the removal names no kind', () => {
    const removed = row('content_removed', { title: 'Алгебра 1' })

    assert.deepEqual(
      resolveStoredNotificationCopy(removed, MACEDONIAN_LOCALE),
      { title: 'Stored title', body: 'Stored body' }
    )
  })

  it('counts distinct flaggers with the Macedonian plural that fits', () => {
    const flagged = (count: number) =>
      resolveStoredNotificationCopy(
        row('flag_threshold', { count, target_type: 'script' }),
        MACEDONIAN_LOCALE
      )

    assert.equal(flagged(1).body, '1 Различен корисник пријави скрипта.')
    assert.equal(flagged(3).body, '3 Различни корисници пријавија скрипта.')
    assert.equal(flagged(11).body, '11 Различни корисници пријавија скрипта.')
    assert.equal(
      resolveStoredNotificationCopy(
        row('flag_threshold', { count: 3, target_type: 'script' }),
        ENGLISH_LOCALE
      ).body,
      '3 distinct users have flagged script.'
    )
  })

  it('leaves an announcement exactly as the admin wrote it', () => {
    assert.deepEqual(
      resolveStoredNotificationCopy(
        row('announcement', null),
        MACEDONIAN_LOCALE
      ),
      { title: 'Stored title', body: 'Stored body' }
    )
  })

  it('drops an empty body rather than rendering a blank line', () => {
    assert.deepEqual(
      resolveStoredNotificationCopy(
        row('announcement', null, { body: null }),
        MACEDONIAN_LOCALE
      ),
      { title: 'Stored title' }
    )
  })

  it('survives data that is not the shape it expects', () => {
    for (const data of [null, [], 'text', { achievement_id: 7 }]) {
      assert.deepEqual(
        resolveStoredNotificationCopy(
          row('achievement_earned', data),
          MACEDONIAN_LOCALE
        ),
        { title: 'Stored title', body: 'Stored body' }
      )
    }
  })
})
