'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  isValid?: boolean
  isLoading?: boolean
  hint?: string
  required?: boolean
  children: React.ReactNode
}

/**
 * FormField Component
 * Wraps form inputs with:
 * - Label with required indicator
 * - Error message with ARIA support
 * - Visual state indicators (valid/error/loading)
 * - Hint text
 */
export function FormField({
  label,
  error,
  isValid,
  isLoading,
  hint,
  required,
  children
}: FormFieldProps) {
  const id = React.useId()
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-navy-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hint && <span className="text-xs text-navy-500">{hint}</span>}
      </div>

      {/* Input Wrapper with State Indicator */}
      <div className="relative">
        {/* Render children with proper props */}
        {React.cloneElement(children as React.ReactElement<any>, {
          id,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : undefined,
          disabled: isLoading,
          className: cn(
            (children as React.ReactElement<any>).props?.className,
            // Base input styling
            'transition-all duration-150 ease-out',
            // State styling
            error && 'border-red-500 bg-red-50',
            isLoading && 'border-amber-500 bg-amber-50',
            isValid && !error && 'border-green-500 bg-green-50',
            // Disabled state
            isLoading && 'opacity-75 cursor-not-allowed'
          )
        } as any)}

        {/* Valid Indicator */}
        {isValid && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <span aria-hidden="true">✓</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="inline-block animate-spin">⟳</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600 mt-1.5"
        >
          {error}
        </p>
      )}
    </div>
  )
}
