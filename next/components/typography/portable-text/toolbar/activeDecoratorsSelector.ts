import type { EditorSelector } from '@portabletext/editor'
import * as selectors from '@portabletext/editor/selectors'

/** Combines per-name `isActiveDecorator` checks into ONE selector, so a
 *  component can read "which of these decorator names are active right now"
 *  with a single `useEditorSelector` call — no hook per name, which the
 *  rules of hooks wouldn't allow inside a loop/map anyway. */
export const activeDecoratorsSelector =
  (names: ReadonlyArray<string>): EditorSelector<ReadonlyArray<string>> =>
  (snapshot) =>
    names.filter((name) => selectors.isActiveDecorator(name)(snapshot))
