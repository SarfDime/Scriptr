'use client'

import { ChevronDownIcon } from '@sanity/icons/ChevronDown'
import { useState } from 'react'

import { cn } from '../../../lib/common-utils'
import type {
  SelectOptionType,
  SelectProps,
} from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { Button } from '../../common/Button'
import { CloseButton } from '../CloseButton'
import { SelectOptionList } from './SelectOptionList'

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
  ...rest
}: SelectProps<T>) => {
  const [selectedOption, setSelectedOption] =
    useState<SelectOptionType<T> | null>(defaultOption ?? null)
  const [listOpen, setListOpen] = useState(false)

  const handleSelect = (option: SelectOptionType<T>) => {
    setSelectedOption(option)
    setSelectedValue?.(option.value)
    setListOpen(!listOpen)
  }

  const handleClear = () => {
    setSelectedOption(null)
    setSelectedValue?.('' as T)
  }

  const handleToggle = () => {
    setListOpen(!listOpen)
  }

  return (
    <Box
      {...rest}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setListOpen(false)
        }
      }}
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
        className={cn(
          'group/trigger grow flex justify-start items-center text-left text-base leading-4 md:leading-[inherit] ',
          'cursor-pointer p-2 gap-2 [&>span]:truncate',
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
      {listOpen && (
        <SelectOptionList<T>
          {...selectListProps}
          buttonProps={buttonProps}
          options={options}
          selectedId={selectedOption?.id}
          handleSelect={handleSelect}
        />
      )}
    </Box>
  )
}
