'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal' | 'soft'
  size?: 'lg' | 'md' | 'icon'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  // V-003: Standardized button states (hover scale 0.98, active scale 0.95, 150ms transition with easing)
  const base = 'inline-flex items-center justify-center rounded-xl font-bold outline-none transition-all duration-[150ms] ease-out focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:scale-[0.98] active:scale-[0.95]'
  const sizes = size === 'lg'
    ? 'h-14 px-6 text-lg' // Larger tap targets per mockup
    : size === 'icon'
      ? 'h-12 w-12 p-0' // Square icon button (48x48px)
      : 'h-12 px-4 text-base'

  // V-003: Shadow hierarchy applied (default → hover → active)
  const variants: Record<string, string> = {
    primary: 'bg-navy-900 text-white shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:bg-navy-800 hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]',
    teal: 'bg-teal-500 text-white shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:bg-teal-400 hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]',
    secondary: 'bg-white border-2 border-moon-200 text-navy-900 shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:border-navy-200 hover:bg-moon-50 hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]',
    ghost: 'bg-transparent text-navy-800 hover:bg-navy-50',
    danger: 'bg-danger-500 text-white shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]',
    soft: 'bg-moon-100 text-navy-900 shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:bg-moon-200 hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]',
  }

  return (
    <button
      // eslint-disable-next-line security/detect-object-injection
      className={cn(base, sizes, variants[variant], className)}
      {...props}
    />
  )
}

type ChipProps = {
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
  variant?: 'def' | 'teal' | 'amber'
}

export function Chip({ selected, children, onClick, variant = 'teal' }: ChipProps) {
  const selectedStyles = {
    def: 'border-navy-900 bg-navy-900 text-white',
    teal: 'border-teal-500 bg-teal-500 text-white',
    amber: 'border-amber-400 bg-amber-400 text-navy-900',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // V-003: Standard button states (hover 0.98, active 0.95, 150ms transition, outline focus)
        // V-006: Touch target minimum 48px height (changed from h-10 to h-12)
        'h-12 min-w-[48px] rounded-full border border-moon-200 px-4 text-sm font-bold transition-all duration-[150ms] ease-out hover:scale-[0.98] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2',
        selected
          // eslint-disable-next-line security/detect-object-injection
          ? selectedStyles[variant]
          : 'bg-white text-navy-800 shadow-[0_2px_4px_rgba(5,10,30,0.08)] hover:bg-moon-50 hover:border-moon-300 hover:shadow-[0_4px_12px_rgba(5,10,30,0.15)] active:shadow-[0_1px_2px_rgba(5,10,30,0.06)]'
      )}
      aria-pressed={selected}
    >
      {children}
    </button>
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl bg-white p-5 shadow-card border border-moon-100 text-navy-900', className)}
      {...props}
    />
  )
}

export function SectionTitle({ title, subtitle, className }: { title: string; subtitle?: string, className?: string }) {
  return (
    <div className={cn("space-y-1 mb-4", className)}>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm opacity-80 font-medium">{subtitle}</p> : null}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-base font-bold text-navy-900">{label}</label>
        {hint ? <span className="text-sm text-navy-800/60">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-14 w-full rounded-2xl border-2 border-moon-100 bg-white px-5 text-lg font-medium outline-none transition-colors',
        'placeholder:text-moon-200',
        'focus:border-teal-400 focus:ring-0',
        props.className
      )}
    />
  )
}

export function Pill({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'teal' | 'amber' | 'navy' }) {
  const variants = {
    default: 'bg-moon-100 text-navy-800',
    teal: 'bg-teal-100 text-teal-800',
    amber: 'bg-amber-100 text-amber-800',
    navy: 'bg-navy-100 text-navy-800',
  }
  return (
    // eslint-disable-next-line security/detect-object-injection
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", variants[variant])}>
      {children}
    </span>
  )
}
