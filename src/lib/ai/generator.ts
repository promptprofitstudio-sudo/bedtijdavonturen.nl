import OpenAI from 'openai'
import { StoryMood } from '@/lib/types'
import { getSecret } from '@/lib/secrets'

interface GeneratedStoryData {
    title: string
    mood: StoryMood
    minutes: number
    excerpt: string
    body: Array<{ type: 'p' | 'pause'; text: string }>
    dialogicPrompts: Array<{ pausePoint: number; question: string; context: string }>
}

export async function generateStoryWithAI(
    name: string,
    ageGroup: string,
    mood: StoryMood,
    theme: string
): Promise<GeneratedStoryData> {

    // --- TEST MODE MOCK ---
    if (process.env.TEST_MODE === 'true') {
        console.log('[Mock] Generating story in TEST_MODE')
        return {
            title: `Avontuur van ${name}`,
            mood,
            minutes: 5,
            excerpt: `Een spannend testverhaal over ${theme}.`,
            body: [
                { type: 'p', text: `Er was eens een ${theme} die ${name} heette.` },
                { type: 'p', text: 'Samen beleefden ze een bedtijdavontuur.' },
                { type: 'pause', text: 'Even rusten...' },
                { type: 'p', text: 'En toen gingen ze slapen. Welterusten.' }
            ],
            dialogicPrompts: [
                { pausePoint: 1, question: 'Wat zie je?', context: 'Check perceptie' },
                { pausePoint: 3, question: 'Hoe voelt hij zich?', context: 'Check emotie' },
                { pausePoint: 4, question: 'Slaap lekker?', context: 'Afsluiting' }
            ]
        }
    }

    const apiKey = await getSecret('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OpenAI API Key not found in Secrets Manager')

    const openai = new OpenAI({ apiKey })

    // ... rest of AI logic ...

    // SAFETY & DIALOGIC LOGIC
    const isToddler = ageGroup === '2-4'
    const safetyInstruction = isToddler
        ? "CRITICAL SAFETY FOR TODDLERS (2-4): Simple words only. Focus on sensory details (soft, warm, quiet). NO scary elements, NO conflict, NO abstract concepts. Keep sentences short."
        : "For Age 4-7: Use warm, slightly more descriptive language. Gentle adventures are okay."

    const prompt = `
    Je bent een expert in rustgevende kinderboekjes.
    Schrijf een kort bedtijdverhaal voor ${name} (${ageGroup}).
    Thema: ${theme}.
    Sfeer: ${mood}.
    
    AGE GROUP INSTRUCTIONS:
    ${safetyInstruction}

    Vereisten:
    - Veilig, rustgevend, geen spanning.
    - Kort (ong. 5 minuten voorlezen).
    - Output MOET valide JSON zijn.
    - Gebruik de PEER-methode voor dialogisch lezen: genereer 3 specifieke momenten om te stoppen en een vraag te stellen.
    
    JSON Structuur:
    {
      "title": "Titel",
      "mood": "${mood}",
      "minutes": 5,
      "excerpt": "Korte samenvatting van 1 zin",
      "body": [
        { "type": "p", "text": "Paragraaf tekst..." },
        { "type": "p", "text": "Volgende paragraaf..." }
      ],
      "dialogicPrompts": [
          { 
            "pausePoint": 0, 
            "question": "Vraag aan kind...", 
            "context": "Uitleg voor ouder waarom deze vraag (bijv. check emotie/woordenschat)" 
          }
      ]
    }
  `

    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'gpt-4o', // or gpt-3.5-turbo if cost is concern, but 4o is better for JSON
        response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    // Parse JSON
    const data = JSON.parse(content) as GeneratedStoryData

    return data
}
