'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'

interface WizardProgressIndicatorProps {
  step: number
  total?: number
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export function WizardProgressIndicator({
  step,
  total = 4,
  deviceType = 'desktop',
}: WizardProgressIndicatorProps) {
  const posthog = usePostHog()
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now())
  const [prevStep, setPrevStep] = useState<number>(1)

  useEffect(() => {
    // Calculate time on previous step
    const timeOnStep = Date.now() - stepStartTime

    // Fire step view event
    posthog?.capture('wizard_step_view', {
      step_number: step,
      step_name: getStepName(step),
      time_on_step_ms: step > 1 ? timeOnStep : 0,
      device_type: deviceType,
      variant_progress_bar: 'variant', // We're showing the progress bar
    })

    // Fire progress viewed event
    posthog?.capture('wizard_progress_viewed', {
      step_number: step,
      progress_percent: (step / total) * 100,
      device_type: deviceType,
      progress_bar_visible: true,
    })

    // Fire encouragement event at 75% (step 3)
    if (step === 3) {
      posthog?.capture('wizard_encouragement_shown', {
        at_step: 3,
        encouragement_text: 'Almost there! Just one more step.',
        device_type: deviceType,
      })
    }

    setPrevStep(step)
    setStepStartTime(Date.now())
  }, [step, posthog, deviceType, stepStartTime])

  const getStepName = (stepNum: number): string => {
    switch (stepNum) {
      case 1:
        return 'child_info'
      case 2:
        return 'mood_selection'
      case 3:
        return 'theme_selection'
      case 4:
        return 'review'
      default:
        return 'unknown'
    }
  }

  const progressPercent = (step / total) * 100
  const isAlmostDone = step === 3

  return (
    <div className="space-y-2">
      {/* Step Counter + Time Estimate */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
          Stap {step} van {total}
        </div>
        {step === 1 && (
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            ⏱ Geschatte tijd: 3-5 minuten
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>

      {/* Encouragement Message at 75% */}
      {isAlmostDone && (
        <div className="animate-in fade-in duration-300">
          <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
            ✨ Bijna klaar! Nog één stap.
          </p>
        </div>
      )}
    </div>
  )
}
