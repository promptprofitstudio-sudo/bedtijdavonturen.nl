'use client'

import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { Card } from '@/components/ui'

interface FAQItem {
  question: string
  answer: string
  index: number
}

const faqItems: FAQItem[] = [
  {
    index: 1,
    question: 'Kan ik altijd mijn plan veranderen?',
    answer:
      'Ja! Je kunt op elk moment upgraden of downgraden. Veranderingen gaan direct in voor je volgende factuurperiode.',
  },
  {
    index: 2,
    question: 'Is er een gratis proefperiode?',
    answer:
      'Voor nieuwe gebruikers bieden we 7 dagen gratis Premium aan. Geen creditcard nodig voor deze proef — je geniet meteen van alle functies.',
  },
  {
    index: 3,
    question: 'Wat gebeurt er met mijn verhalen?',
    answer:
      'Al je gegenereerde verhalen blijven voor altijd in je bibliotheek beschikbaar — ook als je je abonnement opzegt. Ze zijn jouw eigendom.',
  },
  {
    index: 4,
    question: 'Geef je geld terug?',
    answer:
      'Ja, uiteraard! Abonnementen kunnen met één klik worden geannuleerd in je account. Voor refunds en vragen: contact@bedtijdavonturen.nl',
  },
  {
    index: 5,
    question: 'Kan ik maandelijks betalen?',
    answer:
      'Ja! Alle abonnementen zijn maandelijks opzegbaar. Geen langetermijncontract — je bent altijd vrij om te stoppen.',
  },
]

interface PricingFAQProps {
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export function PricingFAQ({ deviceType = 'desktop' }: PricingFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const posthog = usePostHog()

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)

    // Fire analytics event
    posthog?.capture('faq_item_opened', {
      question_index: index,
      question_text: faqItems.find((item) => item.index === index)?.question,
      scroll_position_px: window.scrollY,
      device_type: deviceType,
    })
  }

  return (
    <section className="px-4 py-12 bg-gray-50 dark:bg-gray-900 rounded-3xl">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Veel gestelde vragen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Antwoorden op je vragen over abonnementen en verhalen
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqItems.map((item) => {
            const isExpanded = expandedIndex === item.index

            return (
              <button
                key={item.index}
                onClick={() => handleToggle(item.index)}
                className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                    {item.question}
                  </h3>
                  <span className={`material-symbols-outlined text-primary shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Still have questions? */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Heb je nog meer vragen?
          </p>
          <a
            href="mailto:contact@bedtijdavonturen.nl"
            className="inline-block text-primary font-bold hover:underline text-sm"
          >
            Stuur ons een bericht →
          </a>
        </div>
      </div>
    </section>
  )
}
