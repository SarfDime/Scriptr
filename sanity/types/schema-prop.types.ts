import type { GROUPING_KEYS } from '@shared/config/sanity-constants'
import type { ComponentType, CSSProperties } from 'react'
import type { ReferenceValue } from 'sanity'
import type { StructureToolIconColorsType } from '../structure-tool/icon-helpers'

/** Represents a type typically used in deskStructure to associate an icon with schemas. */
type ChildSchemaType = {
  title: string
  schemaType: string
  icon: ComponentType<{ style?: CSSProperties; className?: string }>
  category?: StructureToolIconColorsType
  type?: string
}

type Parent = Array<ReferenceValue>

type AcademicFieldOptions = {
  grouping?: GroupingKeys
}

// ---------------------------------------------------------------------------
// Fieldsets/Groups — shared presets so each schema only has to name which ones it
// needs; title/description are filled in from the entity name.
// ---------------------------------------------------------------------------

type GroupingKeys = (typeof GROUPING_KEYS)[number]

export type {
  AcademicFieldOptions,
  ChildSchemaType,
  GroupingKeys,
  Parent,
  ReferenceValue,
}
