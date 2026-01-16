import { Story, AgeGroup } from './types'

export type { StoryMood } from './types' // Re-export from types
export { sampleStories }

const sampleStories: Story[] = [
  {
    id: '1',
    childName: 'Noor',
    title: 'Noor en het Fluisterbos',
    mood: 'Rustig',
    ageGroup: '4-7',
    minutes: 7,
    excerpt: 'In het Fluisterbos leren de bomen zachtjes hoe je adem rustig wordt…',
    body: [
      { type: 'p', text: 'Noor liep langzaam tussen bomen die klonken als zachte wind. Elke stap maakte het stiller in haar hoofd.' },
      { type: 'pause', text: '(Oud: Praatpauze wordt nu vervangen door dialogicPrompt)' },
      { type: 'p', text: 'Een uil knikte en zei: “Als je denkt aan iets liefs, wordt de nacht een beetje warmer.”' },
      { type: 'p', text: 'Noor glimlachte. Ze voelde zich veilig. En toen werd haar adem zo rustig dat de slaap haar vanzelf vond.' },
    ],
    dialogicPrompts: [
      { pausePoint: 0, question: 'Wat voor geluid maakt de wind?', context: 'Focus op zintuigen.' },
      { pausePoint: 2, question: 'Waar denk jij aan dat lief is?', context: 'Emotionele veiligheid.' }
    ],
    createdAt: new Date() as any, // Mock timestamp
    userId: 'mock-user',
    profileId: 'mock-profile'
  },
  {
    id: '2',
    childName: 'Milan',
    title: 'Milan en de Lachende Ster',
    mood: 'Grappig',
    ageGroup: '2-4',
    minutes: 6,
    excerpt: 'Een ster die giechelt? Milan helpt haar terug naar haar plek — zonder te hard te doen.',
    body: [
      { type: 'p', text: 'Milan zag een ster die per ongeluk op een wolk was gaan zitten. “Oeps,” zei de ster, “ik ben mijn plekje kwijt!”' },
      { type: 'p', text: 'Samen telden ze heel zachtjes: één… twee… drie… bij elke tel werd de ster een beetje lichter.' },
      { type: 'p', text: 'Toen de ster weer in de lucht hing, fluisterde ze: “Dankjewel. Nu kan jij ook slapen.”' },
    ],
    dialogicPrompts: [
      { pausePoint: 1, question: 'Kun jij ook tot drie tellen?', context: 'Interactie voor peuters.' }
    ],
    createdAt: new Date() as any,
    userId: 'mock-user',
    profileId: 'mock-profile'
  },
]

export function getStoryById(id: string): Story | undefined {
  return sampleStories.find((s) => s.id === id)
}


