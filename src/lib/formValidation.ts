/**
 * Form Validation Utilities
 * Provides reusable validation rules and error messages in Dutch
 */

export type ValidationResult = {
  isValid: boolean
  error?: string
}

export type FieldValidator = (value: string) => ValidationResult

/**
 * Email validation
 * Checks format and length
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'E-mailadres is verplicht' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'E-mailadres: Ongeldig formaat (voorbeeld: naam@domein.nl)' }
  }

  if (email.length > 254) {
    return { isValid: false, error: 'E-mailadres is te lang' }
  }

  return { isValid: true }
}

/**
 * Password validation
 * Minimum 6 characters
 */
export const validatePassword = (password: string, minLength = 6): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Wachtwoord is verplicht' }
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Wachtwoord: Minimaal ${minLength} tekens nodig` }
  }

  return { isValid: true }
}

/**
 * Name validation
 * Checks that name is not empty and reasonable length
 */
export const validateName = (name: string, fieldName = 'Naam'): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: `${fieldName}: Dit veld is verplicht` }
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName}: Minimaal 2 tekens nodig` }
  }

  if (name.length > 50) {
    return { isValid: false, error: `${fieldName}: Maximaal 50 tekens toegestaan` }
  }

  return { isValid: true }
}

/**
 * Required field validation
 */
export const validateRequired = (value: string, fieldName = 'Dit veld'): ValidationResult => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName}: Dit veld is verplicht` }
  }

  return { isValid: true }
}

/**
 * Code validation (alphanumeric with hyphens, uppercase)
 * Format: XXX-XXX or similar
 */
export const validateCode = (code: string): ValidationResult => {
  if (!code.trim()) {
    return { isValid: false, error: 'Code is verplicht' }
  }

  // Allow letters, numbers, and hyphens
  const codeRegex = /^[A-Z0-9\-]+$/
  const upperCode = code.toUpperCase()

  if (!codeRegex.test(upperCode)) {
    return { isValid: false, error: 'Code: Alleen letters, nummers en koppeltekens toegestaan (voorbeeld: KDV-ZON)' }
  }

  if (upperCode.length < 3) {
    return { isValid: false, error: 'Code: Minimaal 3 tekens nodig' }
  }

  if (upperCode.length > 20) {
    return { isValid: false, error: 'Code: Maximaal 20 tekens toegestaan' }
  }

  return { isValid: true }
}

/**
 * Composite validation - validates multiple rules
 */
export const validateField = (
  value: string,
  rules: FieldValidator[]
): ValidationResult => {
  for (const rule of rules) {
    const result = rule(value)
    if (!result.isValid) {
      return result
    }
  }
  return { isValid: true }
}

/**
 * Theme validation (optional field)
 * Minimum 3 characters if provided
 */
export const validateTheme = (theme: string): ValidationResult => {
  if (!theme.trim()) {
    // Optional field
    return { isValid: true }
  }

  if (theme.trim().length < 3) {
    return { isValid: false, error: 'Thema: Minimaal 3 tekens nodig' }
  }

  if (theme.length > 100) {
    return { isValid: false, error: 'Thema: Maximaal 100 tekens toegestaan' }
  }

  return { isValid: true }
}

/**
 * Context validation (optional field)
 */
export const validateContext = (context: string): ValidationResult => {
  if (!context.trim()) {
    // Optional field
    return { isValid: true }
  }

  if (context.trim().length < 2) {
    return { isValid: false, error: 'Context: Minimaal 2 tekens nodig' }
  }

  if (context.length > 200) {
    return { isValid: false, error: 'Context: Maximaal 200 tekens toegestaan' }
  }

  return { isValid: true }
}
