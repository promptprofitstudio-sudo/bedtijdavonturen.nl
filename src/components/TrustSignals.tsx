'use client'

import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'

interface TrustSignalsProps {
  location?: 'footer' | 'hero' | 'pricing'
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export function TrustSignals({
  location = 'footer',
  deviceType = 'desktop',
}: TrustSignalsProps) {
  const posthog = usePostHog()
  const [parentCount, setParentCount] = useState<number | null>(null)
  const [storiesCount, setStoriesCount] = useState<number | null>(null)

  // Load counters on mount and set up polling
  useEffect(() => {
    const startTime = Date.now()
    
    const loadCounters = async () => {
      try {
        // Load parent count
        const parentRes = await fetch('/api/stats/parent-count', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (parentRes.ok) {
          const data = await parentRes.json()
          setParentCount(data.count || 2341)
          
          posthog?.capture('social_proof_counter_loaded', {
            counter_type: 'parents',
            initial_value: data.count || 2341,
            device_type: deviceType,
            api_response_time_ms: Date.now() - startTime,
          })
        } else {
          // Fallback
          setParentCount(2341)
        }
      } catch (error) {
        console.warn('Failed to load parent count:', error)
        setParentCount(2341)
      }

      try {
        // Load daily stories count
        const storiesRes = await fetch('/api/stats/daily-stories', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (storiesRes.ok) {
          const data = await storiesRes.json()
          setStoriesCount(data.count || 1243)
          
          posthog?.capture('social_proof_counter_loaded', {
            counter_type: 'daily_stories',
            initial_value: data.count || 1243,
            device_type: deviceType,
            api_response_time_ms: Date.now() - startTime,
          })
        } else {
          // Fallback
          setStoriesCount(1243)
        }
      } catch (error) {
        console.warn('Failed to load stories count:', error)
        setStoriesCount(1243)
      }
    }

    loadCounters()

    // Poll every 30-60 seconds
    const parentInterval = setInterval(() => {
      loadCounters()
    }, 30000)

    const storiesInterval = setInterval(() => {
      loadCounters()
    }, 60000)

    return () => {
      clearInterval(parentInterval)
      clearInterval(storiesInterval)
    }
  }, [posthog, deviceType, lastUpdateTime])

  const handleBadgeClick = (badgeType: string) => {
    posthog?.capture('trust_badge_clicked', {
      badge_type: badgeType,
      link_target_url: '/security',
      device_type: deviceType,
    })
  }

  const handleBadgeView = (badgeType: string) => {
    posthog?.capture('trust_badge_viewed', {
      badge_type: badgeType,
      location,
      device_type: deviceType,
    })
  }

  // Hero section with parent counter
  if (location === 'hero') {
    return (
      <div className="text-center space-y-3">
        {parentCount !== null && (
          <div
            className="text-sm font-bold text-gray-700 dark:text-gray-300"
            role="status"
            aria-live="polite"
          >
            👨‍👩‍👧 Vertrouwd door {parentCount.toLocaleString('nl-NL')} ouders
          </div>
        )}
      </div>
    )
  }

  // Pricing section with stories counter
  if (location === 'pricing') {
    return (
      <div className="text-center space-y-3 py-6 px-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
        {storiesCount !== null && (
          <div
            className="text-sm font-bold text-primary"
            role="status"
            aria-live="polite"
          >
            📖 {storiesCount.toLocaleString('nl-NL')} verhalen gemaakt vandaag
          </div>
        )}
      </div>
    )
  }

  // Footer section with security badges
  return (
    <div className="space-y-4">
      {/* Security Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/security"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBadgeClick('ssl')}
          onMouseEnter={() => handleBadgeView('ssl')}
          className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
          title="SSL Encrypted"
        >
          🔒 SSL Encrypted
        </a>

        <a
          href="/security"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBadgeClick('pci')}
          onMouseEnter={() => handleBadgeView('pci')}
          className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
          title="PCI DSS Compliant"
        >
          💳 PCI DSS Compliant
        </a>

        <a
          href="/security"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBadgeClick('gdpr')}
          onMouseEnter={() => handleBadgeView('gdpr')}
          className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
          title="GDPR & CCPA Compliant"
        >
          🛡️ GDPR & CCPA
        </a>
      </div>

      {/* Certification Icons */}
      <div className="flex items-center justify-center gap-4">
        <div
          className="relative group"
          onMouseEnter={() => {
            posthog?.capture('certification_tooltip_shown', {
              certification_name: 'safe_for_kids',
              location,
              tooltip_text: 'Geverifieerd als Veilig voor Kinderen',
              device_type: deviceType,
            })
          }}
        >
          <div className="text-2xl cursor-help">👶</div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Geverifieerd als Veilig voor Kinderen
          </div>
        </div>

        <div
          className="relative group"
          onMouseEnter={() => {
            posthog?.capture('certification_tooltip_shown', {
              certification_name: 'eu_standards',
              location,
              tooltip_text: 'Voldoet aan Europese Normen',
              device_type: deviceType,
            })
          }}
        >
          <div className="text-2xl cursor-help">🇪🇺</div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Voldoet aan Europese Normen
          </div>
        </div>
      </div>
    </div>
  )
}
