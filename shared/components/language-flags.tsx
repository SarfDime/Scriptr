import type { ComponentType, SVGProps } from 'react'
import type { SupportedLanguageId } from '../config/localization-constants'

/** A round flag, sized by the caller (`1em` by default). */
export type LanguageFlagIcon = ComponentType<SVGProps<SVGSVGElement>>

export const LangEnUsIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 512 512'
      {...props}
    >
      <title>United States Flag</title>
      <mask id='circleFlagsLangEnUs0'>
        <circle cx='256' cy='256' r='256' fill='#fff' />
      </mask>
      <g mask='url(#circleFlagsLangEnUs0)'>
        <path
          fill='#eee'
          d='M256 0L0 256v64l32 32l-32 32v128l22-8l23 8h23l54-32l54 32h32l48-32l48 32h32l54-32l54 32h68l-8-22l8-23v-23l-32-54l32-54v-32l-32-48l32-48v-32l-32-54l32-54V0z'
        />
        <path
          fill='#d80027'
          d='M224 64v64h160l64-64zm0 128l32 64l-48 48v208h96V304h208v-96H304l16-16zM0 320v64h128l-64 64H0v64h45l131-131v-45l16-16zm336 16l176 176v-45L381 336Z'
        />
        <path
          fill='#0052b4'
          d='M0 0v256h256V0zm512 68L404 176h108zM404 336l108 108V336zm-228 68L68 512h108zm160 0v108h108z'
        />
        <path
          fill='#eee'
          d='m187 243l57-41h-70l57 41l-22-67zm-81 0l57-41H93l57 41l-22-67zm-81 0l57-41H12l57 41l-22-67zm162-81l57-41h-70l57 41l-22-67zm-81 0l57-41H93l57 41l-22-67zm-81 0l57-41H12l57 41l-22-67Zm162-82l57-41h-70l57 41l-22-67zm-81 0l57-41H93l57 41l-22-67Zm-81 0l57-41H12l57 41l-22-67Z'
        />
      </g>
    </svg>
  )
}

export const LangMkIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 512 512'
      {...props}
    >
      <title>Macedonian Flag</title>
      <mask id='circleFlagsLangMk0'>
        <circle cx='256' cy='256' r='256' fill='#fff' />
      </mask>
      <g mask='url(#circleFlagsLangMk0)'>
        <path
          fill='#ffda44'
          d='M0 0h68.2l86 33.6L216.5 0h78.8l61.2 34.8L443.8 0H512v68.3l-31.4 88l31.4 60.2v78.8L477.4 356l34.6 87.8V512h-68.2l-77-37.3l-71.3 37.3h-78.8l-61-39.7L68.2 512H0v-68l40.3-88.2L0 295.5v-78.8L40.3 157L0 68.2z'
        />
        <path
          fill='#d80027'
          d='M295.5 512h148.3L256 256zm-79-512H68.2L256 256zm.2 512L256 256L68.2 512zM0 216.7L256 256L0 68.2zm0 227.2L256 256L0 295.5zM512 68.3L256 256l256-39.5zM443.8 0H295.3L256 256zM512 443.8V295.3L256 256z'
        />
        <circle cx='256' cy='256' r='89' fill='#d80027' />
        <circle cx='256' cy='256' r='66.8' fill='#ffda44' />
      </g>
    </svg>
  )
}

/**
 * The flag each supported language is drawn with. Keyed by the locale id, so a
 * new language fails to compile until it has one, and both the Studio's field
 * wrapper and the reader-facing switch pick the same art.
 */
export const LANGUAGE_FLAGS: Record<SupportedLanguageId, LanguageFlagIcon> = {
  en: LangEnUsIcon,
  mk: LangMkIcon,
}
