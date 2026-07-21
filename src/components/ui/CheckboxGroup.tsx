export interface CheckboxGroupOption {
  value: string
  label: string
}

export interface CheckboxGroupProps {
  label?: string
  options: CheckboxGroupOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}
