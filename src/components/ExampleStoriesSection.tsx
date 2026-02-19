'use client'

import { useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { Card } from '@/components/ui'

interface ExampleStory {
  id: string
  snippet: string
  ageGroup: string
  tone: string[]
  fullStory: string
}

const exampleStories: ExampleStory[] = [
  {
    id: 'example_001',
    snippet:
      'Lotte sluit haar ogen en ziet een klein molletje dat zich knus ingraaft in zijn zachtste holletje. De grond ruikt naar wortels en zoemende bijen. Langzaam, heel langzaam, valt het molletje in slaap...',
    ageGroup: '2-4 jaar',
    tone: ['Rustig', 'Troostend'],
    fullStory:
      'Lotte sluit haar ogen en ziet een klein molletje dat zich knus ingraaft in zijn zachtste holletje. De grond ruikt naar wortels en zoemende bijen. Langzaam, heel langzaam, valt het molletje in slaap. De maan schijnt zacht door de aarde. Vogels fluiten zachtjes. En daar slaapt het molletje, veilig en warm, net als jij straks in je bedje. Goedenacht, molletje. Goedenacht, schat.',
  },
  {
    id: 'example_002',
    snippet:
      'Maya is een dappere astronaut die net haar eerste ruimtemissie begint. Ze knijpt haar ogen dicht in de raket... 3... 2... 1... POOOOOF! De raket stijgt op. Sterren zweven voorbij...',
    ageGroup: '4-7 jaar',
    tone: ['Avontuurlijk', 'Grappig'],
    fullStory:
      'Maya is een dappere astronaut die net haar eerste ruimtemissie begint. Ze knijpt haar ogen dicht in de raket... 3... 2... 1... POOOOOF! De raket stijgt op. Sterren zweven voorbij. Ze ziet planeten in mooie kleuren. Opeens hoort ze: "Piiep! Piiep!" Een vriendelijke alien zwaait naar haar! Maya lacht en zwaait terug. Ze vliegen samen langs de zon, voorbij de Melkweg, en dan... oh, is het niet prachtig... dalen ze neer op een bed van wolken. Slaap lekker, dappere astronaut.',
  },
  {
    id: 'example_003',
    snippet:
      'Remi ontdekt een geheime schatkaart in de zolderkast. Met zijn vergrootglas en een zaklantern begint het avontuur. Piratenzang echoot door het huis... Waar staat het X?',
    ageGroup: '6-10 jaar',
    tone: ['Spannend', 'Mysterieus'],
    fullStory:
      'Remi ontdekt een geheime schatkaart in de zolderkast. Met zijn vergrootglas en een zaklantern begint het avontuur. Piratenzang echoot door het huis... waar staat het X? Voorzichtig stapt hij naar beneden. De trap kraakt... aha! Onder het bed! Daar ligt een houten kistje. "Ik heb het gevonden!" fluistert Remi. Hij opent het... goud en juwelen glinsteren in het maanlicht. Maar eigenlijk, bedenkt hij zich, was het allermooiste wel het spoor volgen zelf. Tevreden en moe valt hij in slaap, dromerij van avonturen en schatten.',
  },
]

interface ExampleStoriesProps {
  onStoryOpen?: (storyId: string) => void
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export function ExampleStoriesSection({
  onStoryOpen,
  deviceType = 'desktop',
}: ExampleStoriesProps) {
  const [selectedStory, setSelectedStory] = useState<ExampleStory | null>(null)
  const posthog = usePostHog()

  const handleStoryCardHover = (storyId: string, position: number) => {
    posthog?.capture('example_story_card_hovered', {
      story_id: storyId,
      card_position: position,
      device_type: deviceType,
      story_age_group: exampleStories[position - 1]?.ageGroup,
    })
  }

  const handleReadClick = (story: ExampleStory, position: number) => {
    posthog?.capture('example_story_read_click', {
      story_id: story.id,
      card_position: position,
      child_age: story.ageGroup,
      device_type: deviceType,
    })

    setSelectedStory(story)
    onStoryOpen?.(story.id)
  }

  return (
    <>
      {/* Stories Section */}
      <section className="px-4 py-12 bg-gradient-to-b from-white via-blue-50 to-white dark:from-gray-900 dark:via-blue-900/10 dark:to-gray-900">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              Zien wat mogelijk is
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Echte verhalen, gegenereerd door AI
            </p>
          </div>

          {/* Stories Grid/Carousel */}
          <div className="grid grid-cols-1 gap-4">
            {exampleStories.map((story, idx) => (
              <Card
                key={story.id}
                className="hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-md"
                onMouseEnter={() => handleStoryCardHover(story.id, idx + 1)}
                onClick={() => handleReadClick(story, idx + 1)}
              >
                <div className="space-y-3">
                  {/* Story Snippet */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    &quot;{story.snippet}&quot;
                  </p>

                  {/* Age Badge & Tone Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {story.ageGroup}
                    </span>
                    {story.tone.map((tone) => (
                      <span
                        key={tone}
                        className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full"
                      >
                        {tone}
                      </span>
                    ))}
                  </div>

                  {/* Read Link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReadClick(story, idx + 1)
                    }}
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    Lees volledige verhaal →
                  </button>

                  {/* Could Be Yours Text */}
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Dit zou jouw kind zijn 👶
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Klaar voor meer? Maak een uniek verhaal voor jouw kind.
            </p>
            <button className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-full hover:bg-primary/90 transition-all active:scale-95">
              <span>Begin je eerste verhaal</span>
              <span className="material-symbols-outlined">auto_fix_high</span>
            </button>
          </div>
        </div>
      </section>

      {/* Full Story Modal */}
      {selectedStory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSelectedStory(null)}
            role="presentation"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {selectedStory.ageGroup}
                </h3>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  aria-label="Sluit verhaal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedStory.tone.map((tone) => (
                    <span
                      key={tone}
                      className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full"
                    >
                      {tone}
                    </span>
                  ))}
                </div>

                <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedStory.fullStory}
                </p>

                {/* CTA Button in Modal */}
                <button
                  onClick={() => setSelectedStory(null)}
                  className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-all mt-6"
                >
                  Maak jouw eigen verhaal
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
