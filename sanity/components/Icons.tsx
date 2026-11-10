import type { SVGProps } from 'react'

export const ButtonIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 24 24'
      {...props}
    >
      <title>Button Icon</title>
      <path
        fill='currentColor'
        d='M12 8q-1.65 0-2.825 1.175T8 12q0 1.125.563 2.075t1.562 1.475q.4.2.563.587t-.013.788q-.175.35-.525.525t-.7 0q-1.575-.75-2.512-2.225T6 12q0-2.5 1.75-4.25T12 6q1.775 0 3.263.938T17.475 9.5q.15.35-.012.7t-.513.5q-.4.175-.8 0t-.6-.575q-.525-1-1.475-1.562T12 8m0-4Q8.65 4 6.325 6.325T4 12q0 3.15 2.075 5.4t5.2 2.55q.425.05.737.375t.288.75t-.313.7t-.712.25q-1.95-.125-3.638-.975t-2.95-2.213t-1.975-3.125T2 12q0-2.075.788-3.9t2.137-3.175T8.1 2.788T12 2q3.925 0 6.838 2.675t3.187 6.6q.05.4-.237.688t-.713.312t-.762-.275t-.388-.725q-.375-3-2.612-5.137T12 4m7.55 17.5l-3.3-3.275l-.75 2.275q-.125.35-.475.338t-.475-.363L12.275 12.9q-.1-.275.125-.5t.5-.125l7.575 2.275q.35.125.363.475t-.338.475l-2.275.75l3.3 3.3q.425.425.425.975t-.425.975t-.987.425t-.988-.425'
      />
    </svg>
  )
}

export const AlignText = (
  props: SVGProps<SVGSVGElement> & { alignment: 'left' | 'center' | 'right' }
) => {
  const { alignment, ...restProps } = props
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 24 24'
      {...restProps}
    >
      <title>Align Text</title>
      {alignment === 'left' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M9 4.5h10m-10 5h5m-5 5h10m-10 5h5M5 3v18'
        />
      )}
      {alignment === 'center' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M3 3h18M8 9h8M3 15h18M8 21h8'
        />
      )}
      {alignment === 'right' && (
        <path
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          d='M5 4.5h10m-5 5h5m-10 5h10m-5 5h5M19 3v18'
        />
      )}
    </svg>
  )
}

export const CircleFlagsEarth = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 512 512'
      {...props}
    >
      <title>Earth Flag</title>
      <mask id='circleFlagsEarth0'>
        <circle cx='256' cy='256' r='256' fill='#fff' />
      </mask>
      <g mask='url(#circleFlagsEarth0)'>
        <path fill='#0052b4' d='M0 0h512v512H0z' />
        <path
          fill='#eee'
          d='M302.7 233.7a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M209.4 72.3a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M302.7 72.3a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M349.2 153a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M209.4 233.7a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M162.8 153a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83s-37 83-83 83s-83-37-83-83s37-83 83-83'
        />
        <path
          fill='#eee'
          d='M256 153.1a103.1 103.1 0 0 0 0 206a103.1 103.1 0 0 0 0-206m0 20c46 0 83 37 83 83c0 45.9-37 83-83 83s-83-37.1-83-83c0-46 37-83 83-83'
        />
      </g>
    </svg>
  )
}

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
