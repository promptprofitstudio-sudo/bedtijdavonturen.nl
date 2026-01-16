# Bedtijdavonturen — Next.js + Tailwind UI Scaffold

Mobile-first UI scaffold voor **bedtijdavonturen.nl** (Parent mode + Kid mode) met de kernflows:
- Home “Vanavond”
- Wizard (60 sec)
- Bibliotheek
- Story Reader (dim)
- Luistermodus (met “scherm uit” overlay)
- Pricing

## Quickstart

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Routes
- `/` — Home
- `/wizard` — Create flow (client state)
- `/library` — Library
- `/story/[id]` — Reader (dim)
- `/listen/[id]` — Listen (UI ready)
- `/pricing` — Plans
- `/account` — Account placeholder

## Notes
- Data is mock (`src/lib/mockData.ts`).
- “Print/PDF” knoppen zijn UI placeholders.
- Audio player is ready; voeg een `src` toe zodra TTS/voice in backend beschikbaar is.

## Next build steps (suggested)
1. Auth (ouder account) + child profiles
2. Story generation endpoint + persistence
3. PDF export
4. TTS pipeline + audio hosting + offline caching (PWA)
