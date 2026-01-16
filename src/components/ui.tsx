'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'lg' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-lavender-400 focus-visible:ring-offset-2 focus-visible:ring-offset-moon-50 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = size === 'lg'
    ? 'h-12 px-4 text-base'
    : 'h-10 px-3 text-sm'

  const variants: Record<string, string> = {
    primary: 'bg-ink-950 text-moon-50 shadow-card hover:opacity-95 active:opacity-90',
    secondary: 'bg-moon-100 text-ink-950 hover:bg-moon-200',
    ghost: 'bg-transparent text-ink-950 hover:bg-moon-100',
    danger: 'bg-danger-500 text-white hover:opacity-95',
  }

  return (
    <button
      className={cn(base, sizes, variants[variant], className)}
      {...props}
    />
  )
}

type ChipProps = {
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Chip({ selected, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 min-w-[48px] rounded-full border px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-lavender-400 focus-visible:ring-offset-2 focus-visible:ring-offset-moon-50',
        selected
          ? 'border-ink-950 bg-ink-950 text-moon-50'
          : 'border-moon-200 bg-white text-ink-950 hover:bg-moon-100'
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
      className={cn('rounded-2xl bg-white p-4 shadow-card border border-moon-100', className)}
      {...props}
    />
  )
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-ink-800/80">{subtitle}</p> : null}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink-900">{label}</label>
        {hint ? <span className="text-xs text-ink-800/70">{hint}</span> : null}
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
        'h-12 w-full rounded-xl border border-moon-200 bg-white px-4 text-base outline-none',
        'focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200',
        props.className
      )}
    />
  )
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-moon-100 px-3 py-1 text-xs font-semibold text-ink-900">
      {children}
    </span>
  )
}
