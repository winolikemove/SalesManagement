'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Number Input component that automatically removes leading zeros
 * Example: User types "0788" -> displays "788"
 */
export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  allowDecimal?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowDecimal = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(String(value || ''))

    // Sync display value when external value changes
    React.useEffect(() => {
      if (value === 0 || value === null || value === undefined) {
        setDisplayValue('')
      } else if (allowDecimal) {
        // Truncate to 2 decimal places (not round) but display naturally
        const truncated = Math.floor(value * 100) / 100
        // Display as is - don't force trailing zeros
        // e.g., 2 stays as "2", 2.5 stays as "2.5", 2.567 becomes "2.56"
        setDisplayValue(String(truncated))
      } else {
        setDisplayValue(String(value))
      }
    }, [value, allowDecimal])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Allow empty value
      if (inputValue === '') {
        setDisplayValue('')
        onChange(0)
        return
      }

      // Remove non-numeric characters (except decimal point if allowed)
      if (allowDecimal) {
        inputValue = inputValue.replace(/[^\d.]/g, '')
        // Keep only first decimal point
        const parts = inputValue.split('.')
        if (parts.length > 2) {
          inputValue = parts[0] + '.' + parts.slice(1).join('')
        }
      } else {
        inputValue = inputValue.replace(/[^\d]/g, '')
      }

      // Remove leading zeros (but keep single zero)
      if (allowDecimal && inputValue.includes('.')) {
        const [integer, decimal] = inputValue.split('.')
        const cleanInteger = integer === '' ? '' : String(parseInt(integer || '0', 10))
        inputValue = cleanInteger + (decimal !== undefined ? '.' + decimal : '')
      } else if (inputValue.length > 1) {
        inputValue = String(parseInt(inputValue, 10))
      }

      setDisplayValue(inputValue)

      // Convert to number and call onChange
      const numValue = allowDecimal ? parseFloat(inputValue) : parseInt(inputValue, 10)
      onChange(isNaN(numValue) ? 0 : numValue)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Final cleanup on blur
      let finalValue = displayValue

      if (finalValue === '' || finalValue === '.') {
        setDisplayValue('0')
        onChange(0)
        return
      }

      if (allowDecimal) {
        const numValue = parseFloat(finalValue)
        if (!isNaN(numValue)) {
          setDisplayValue(String(numValue))
          onChange(numValue)
        }
      } else {
        const numValue = parseInt(finalValue, 10)
        if (!isNaN(numValue)) {
          setDisplayValue(String(numValue))
          onChange(numValue)
        }
      }

      // Call original onBlur if provided
      props.onBlur?.(e)
    }

    return (
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      />
    )
  }
)

NumberInput.displayName = 'NumberInput'

export { NumberInput }
