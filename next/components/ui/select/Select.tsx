'use client'

import { ChevronDownIcon } from '@sanity/icons/ChevronDown'
import { type CSSProperties, type MouseEvent, useState } from 'react'

import { cn } from '../../../lib/common-utils'
import type {
  SelectOptionType,
  SelectProps,
} from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { Button } from '../../common/Button'
import { CloseButton } from '../CloseButton'
import { SelectOptionList } from './SelectOptionList'

/** Gap between the trigger and the open list. */
const LIST_GAP_PX = 4
/** Tallest the open list may get before it scrolls on its own. */
const LIST_MAX_HEIGHT_PX = 240
/** Below this there is no room worth opening into. */
const LIST_MIN_HEIGHT_PX = 80

/**
 * The visible box the list may use: the nearest scrolling ancestor (a dialog
 * body clips its own content, so the viewport is too generous a boundary),
 * clamped to the viewport.
 */
function getListClip(trigger: HTMLElement) {
  let container = trigger.parentElement
  while (container) {
    if (/auto|scroll|hidden/.test(getComputedStyle(container).overflowY)) break
    container = container.parentElement
  }

  const rect = container?.getBoundingClientRect()
  return {
    top: Math.max(rect?.top ?? 0, 0),
    bottom: Math.min(rect?.bottom ?? window.innerHeight, window.innerHeight),
  }
}

/**
 * Keeps the list inside the space that actually exists for it: it opens
 * downwards when it fits, flips up near the bottom edge of the clipping
 * container, and caps its height so a long list scrolls inside itself instead
 * of stretching the form around it.
 */
function getListStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const clip = getListClip(trigger)
  const spaceBelow = clip.bottom - rect.bottom - LIST_GAP_PX
  const spaceAbove = rect.top - clip.top - LIST_GAP_PX
  const openUp = spaceBelow < LIST_MIN_HEIGHT_PX && spaceAbove > spaceBelow
  const space = Math.max(openUp ? spaceAbove : spaceBelow, LIST_MIN_HEIGHT_PX)

  return {
    top: openUp ? 'auto' : '100%',
    bottom: openUp ? '100%' : 'auto',
    marginTop: openUp ? 0 : LIST_GAP_PX,
    marginBottom: openUp ? LIST_GAP_PX : 0,
    maxHeight: Math.min(space, LIST_MAX_HEIGHT_PX),
  }
}

/** A component that renders a select dropdown with a button as the trigger.
 * It receives a list of options and displays the selected option's label in the button.
 * It also receives a callback that is triggered when the user selects an option.
 */
export const Select = <T = string>({
  options,
  placeholder = 'Select...',
  clearable = false,
  hideChevron,
  selectListProps,
  defaultOption,
  buttonProps,
  triggerProps,
  setSelectedValue,
  icon,
  disabled = false,
  ...rest
}: SelectProps<T>) => {
  const [selectedOption, setSelectedOption] =
    useState<SelectOptionType<T> | null>(defaultOption ?? null)
  const [listOpen, setListOpen] = useState(false)
  const [listStyle, setListStyle] = useState<CSSProperties>()

  const handleSelect = (option: SelectOptionType<T>) => {
    setSelectedOption(option)
    setSelectedValue?.(option.value)
    setListOpen(!listOpen)
  }

  const handleClear = () => {
    setSelectedOption(null)
    setSelectedValue?.('' as T)
  }

  const handleToggle = (event: MouseEvent<HTMLElement>) => {
    if (disabled) return
    if (!listOpen) setListStyle(getListStyle(event.currentTarget))
    setListOpen(!listOpen)
  }

  return (
    <Box
      {...rest}
      // onBlur={(e) => {
      //   if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      //     setListOpen(false)
      //   }
      // }}
      className={cn(
        'group/select relative flex w-full items-center text-fg',
        'button button-sm basic rounded-lg ui-above-inside p-0',
        rest.className
      )}
      data-open={listOpen}
      data-valid={Boolean(selectedOption)}
    >
      <Button
        onClick={handleToggle}
        aria-expanded={listOpen}
        {...triggerProps}
        disabled={disabled || triggerProps?.disabled}
        className={cn(
          'group/trigger grow flex justify-start items-center text-left text-base leading-4 md:leading-[inherit] ',
          'cursor-pointer p-2 gap-2 [&>span]:truncate',
          disabled && 'cursor-not-allowed opacity-60',
          triggerProps?.className
        )}
      >
        {icon && icon}
        <span className='min-w-0 flex-1 truncate'>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {!hideChevron && (
          <ChevronDownIcon
            className={cn(
              'chevron-down ml-auto transition duration-100 group-aria-expanded/trigger:rotate-180'
            )}
          />
        )}
      </Button>
      {clearable && selectedOption && (
        <CloseButton
          onClick={handleClear}
          className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none'
        />
      )}
      {listOpen && !disabled && (
        <SelectOptionList<T>
          {...selectListProps}
          style={{ ...selectListProps?.style, ...listStyle }}
          buttonProps={buttonProps}
          options={options}
          selectedId={selectedOption?.id}
          handleSelect={handleSelect}
        />
      )}
    </Box>
  )
}
