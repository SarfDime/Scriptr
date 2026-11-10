import assert from 'node:assert/strict'
import test from 'node:test'
import { selectQualifyingDefinitions } from './achievements'

const studyA = '11111111-1111-4111-8111-111111111111'
const studyB = '22222222-2222-4222-8222-222222222222'

const definitions = [
  { id: 'global-small', threshold: 3, study_id: null },
  { id: 'global-large', threshold: 20, study_id: null },
  { id: 'study-a', threshold: 2, study_id: studyA },
  { id: 'study-b', threshold: 2, study_id: studyB },
]

test('a global definition is measured across the platform, not the study', () => {
  const qualifying = selectQualifyingDefinitions(definitions, {
    studyId: studyA,
    global: 5,
    scoped: 1,
  })
  assert.deepEqual(
    qualifying.map((definition) => definition.id),
    ['global-small']
  )
})

test('a study definition is measured inside its own study', () => {
  const qualifying = selectQualifyingDefinitions(definitions, {
    studyId: studyA,
    global: 0,
    scoped: 2,
  })
  assert.deepEqual(
    qualifying.map((definition) => definition.id),
    ['study-a']
  )
})

test('definitions of another study never qualify', () => {
  const qualifying = selectQualifyingDefinitions(definitions, {
    studyId: studyA,
    global: 100,
    scoped: 100,
  })
  assert.deepEqual(
    qualifying.map((definition) => definition.id),
    ['global-small', 'global-large', 'study-a']
  )
})

test('a mutation outside any study only evaluates global definitions', () => {
  const qualifying = selectQualifyingDefinitions(definitions, {
    studyId: null,
    global: 3,
    scoped: 0,
  })
  assert.deepEqual(
    qualifying.map((definition) => definition.id),
    ['global-small']
  )
})

test('nothing qualifies below every threshold', () => {
  assert.deepEqual(
    selectQualifyingDefinitions(definitions, {
      studyId: studyB,
      global: 2,
      scoped: 1,
    }),
    []
  )
})
