'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

interface TryStoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TryStoryModal({ isOpen, onClose }: TryStoryModalProps) {
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const posthog = usePostHog()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!childName.trim()) {
      newErrors.childName = 'Naam is verplicht'
    } else if (childName.trim().length > 50) {
      newErrors.childName = 'Naam mag niet langer dan 50 karakters zijn'
    }

    if (!childAge) {
      newErrors.childAge = 'Leeftijd is verplicht'
    } else {
      const age = parseInt(childAge)
      if (isNaN(age) || age < 0 || age > 18) {
        newErrors.childAge = 'Voer een geldige leeftijd in (0-18)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getAgeGroup = (age: string): string => {
    const ageNum = parseInt(age)
    if (ageNum <= 3) return '0-3'
    if (ageNum <= 5) return '3-5'
    if (ageNum <= 8) return '6-8'
    if (ageNum <= 12) return '9-12'
    return '13+'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Fire analytics event
      posthog?.capture('create_story_submitted', {
        child_age_group: getAgeGroup(childAge),
        child_age_exact: parseInt(childAge),
        email_provided: email.length > 0,
        form_completion_time_ms: 0, // Will be calculated if needed
      })

      // Create anonymous session
      const sessionData = {
        childName: childName.trim(),
        childAge: parseInt(childAge),
        email: email || undefined,
      }

      // Store in localStorage for wizard to access
      localStorage.setItem('tempStoryData', JSON.stringify(sessionData))

      // Fire wizard started event
      const deviceType = getDeviceType()
      posthog?.capture('wizard_started_from_cta', {
        source: 'landing_cta',
        device_type: deviceType,
        session_duration_ms: 0,
      })

      // Redirect to wizard
      router.push('/wizard')

      // Close modal
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ submit: 'Er is een fout opgetreden. Probeer opnieuw.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDeviceType = (): string => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full pointer-events-auto animate-in fade-in scale-in duration-200"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          {/* Close Button */}
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              aria-label="Sluit formulier"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <h2
              id="modal-title"
              className="text-2xl font-black text-gray-900 dark:text-white mb-2"
            >
              Jouw eerste verhaal
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Vertel ons wat over je kind, en we maken een uniek slaapverhaal speciaal voor hen.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Child Name */}
              <div>
                <label htmlFor="childName" className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Naam van je kind *
                </label>
                <input
                  id="childName"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="bv. Emma"
                  maxLength={50}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors ${
                    errors.childName
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } dark:bg-gray-800 dark:text-white focus:outline-none focus:border-primary`}
                  disabled={isSubmitting}
                  required
                />
                {errors.childName && (
                  <p className="text-xs text-red-500 mt-1">{errors.childName}</p>
                )}
              </div>

              {/* Child Age */}
              <div>
                <label htmlFor="childAge" className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  Leeftijd *
                </label>
                <select
                  id="childAge"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border-2 transition-colors ${
                    errors.childAge
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } dark:bg-gray-800 dark:text-white focus:outline-none focus:border-primary`}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Kies een leeftijd...</option>
                  {Array.from({ length: 19 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} jaar
                    </option>
                  ))}
                </select>
                {errors.childAge && (
                  <p className="text-xs text-red-500 mt-1">{errors.childAge}</p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                  E-mail (optioneel)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Zodat je je verhalen later terug kunt vinden
                </p>
              </div>

              {/* Error */}
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !childName || !childAge}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">loading</span>
                    Bezig...
                  </>
                ) : (
                  <>
                    <span>Maak mijn verhaal</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Geen account nodig • Geen betaling vereist
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
