'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { searchCities, type CityEntry } from '@/lib/cities'

export interface CityAutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helperText?: string
}

// Free-text underneath (the field this feeds is still a plain `location`
// string column, same as before) — this only helps the user pick a
// real, correctly-spelled town rather than restructuring how location is
// stored. Selecting a suggestion fills just the city name; the voivodeship
// shown in the dropdown is disambiguation only, not part of the saved value.
export function CityAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  const suggestions = isOpen ? searchCities(value) : []

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectCity(city: CityEntry) {
    onChange(city.name)
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectCity(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-controls={`${inputId}-listbox`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
          setHighlightedIndex(0)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((city, i) => (
            <li key={`${city.name}-${city.voivodeship}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === highlightedIndex}
                // Fires before the input's onBlur/click-outside handler would
                // otherwise close the list first and swallow the click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCity(city)}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm',
                  i === highlightedIndex
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {city.name}, woj. {city.voivodeship.toLowerCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
