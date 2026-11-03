'use client'

import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import {
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { hasUnsupportedScript } from '@shared/utils/text-language.utils'
import { useState } from 'react'

/** The two rich-text fields a script form edits. */
export type ScriptTextField = 'title' | 'description'

export type ScriptTextValues = {
  title: PortableTextValue
  description: PortableTextValue
}

/**
 * Title/description state and the validation flags both script forms show.
 * Errors stay hidden until the field has been edited, so a pristine form is
 * not covered in red.
 *
 * The editors themselves are uncontrolled, so a reset is applied by remounting
 * them (see `ScriptDetailsFields`' `resetKey`) rather than by this hook.
 */
export function useScriptTextFields({
  title: initialTitle,
  description: initialDescription,
}: ScriptTextValues) {
  const [title, setTitle] = useState<PortableTextValue>(initialTitle)
  const [description, setDescription] =
    useState<PortableTextValue>(initialDescription)
  const [touched, setTouched] = useState<ReadonlySet<ScriptTextField>>(
    () => new Set()
  )

  const markTouched = (field: ScriptTextField) =>
    setTouched((current) =>
      current.has(field) ? current : new Set(current).add(field)
    )

  const titleText = portableTextToPlainText(title)
  const descriptionText = portableTextToPlainText(description)
  const titleHasContent = titleText.trim() !== ''
  const titleTooLong =
    portableTextJsonByteLength(title) > PORTABLE_TEXT_LIMITS.scriptTitleBytes
  const titleUnsupportedScript = hasUnsupportedScript(titleText)
  const descriptionHasContent = descriptionText.trim() !== ''
  const descriptionTooLong =
    portableTextJsonByteLength(description) >
    PORTABLE_TEXT_LIMITS.scriptDescriptionBytes
  const descriptionUnsupportedScript = hasUnsupportedScript(descriptionText)

  return {
    title,
    description,
    changeTitle: (value: PortableTextValue) => {
      markTouched('title')
      setTitle(value)
    },
    changeDescription: (value: PortableTextValue) => {
      markTouched('description')
      setDescription(value)
    },
    titleHasContent,
    descriptionHasContent,
    titleTooLong,
    descriptionTooLong,
    titleUnsupportedScript,
    descriptionUnsupportedScript,
    /** Both fields hold what the API accepts. */
    isValid:
      isScriptTitlePortableTextValue(title) &&
      isScriptDescriptionPortableTextValue(description) &&
      !titleTooLong &&
      !descriptionTooLong &&
      !titleUnsupportedScript &&
      !descriptionUnsupportedScript,
    titleValid: titleHasContent && !titleTooLong && !titleUnsupportedScript,
    titleInvalid:
      touched.has('title') &&
      (!titleHasContent || titleTooLong || titleUnsupportedScript),
    descriptionInvalid:
      touched.has('description') &&
      (descriptionTooLong || descriptionUnsupportedScript),
    touchAll: () =>
      setTouched(new Set<ScriptTextField>(['title', 'description'])),
    reset: (next: ScriptTextValues) => {
      setTitle(next.title)
      setDescription(next.description)
      setTouched(new Set())
    },
  }
}

export type UseScriptTextFieldsReturn = ReturnType<typeof useScriptTextFields>
