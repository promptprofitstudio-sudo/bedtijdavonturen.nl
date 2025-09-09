# Update: automatische DALL·E-afbeeldingen per verhaal

Deze update maakt het mogelijk om automatisch één of meerdere afbeeldingen te genereren bij elk bedtijdverhaal via DALL·E (OpenAI Images API). De afbeeldingen worden door `story.js` opgevraagd na het genereren van het verhaal en teruggegeven samen met de tekst.

## Wat is er nieuw
- **`images.js`**: Genereert 1–4 DALL·E-beelden op basis van de naam van het kind, het thema en het lievelingsdier. Gebruikt het model `gpt-image-1` en houdt rekening met AVG/ethiek (geen realistische gezichten of merken).
- **`story.js`**: Na het genereren van het verhaal via Gemini roept `story.js` automatisch `images.js` aan via `callInternalFunction()` en combineert de output. Het resultaat bevat nu een `story` en een array `images`.
- **`_common.js`**: Nieuwe helper `callInternalFunction()` om andere Netlify functions aan te roepen met het `X-Site-Secret`. Bevat ook een minimalistische `geminiGenerate()` functie voor tekstgeneratie.

## Installatie
1. Zet de bestanden in je Netlify-project onder `netlify/functions/` en voeg `README_IMAGES_UPDATE.md` toe ter documentatie.
2. Vul de volgende omgevingvariabelen in bij Netlify:
   - `OPENAI_API_KEY` – API-key voor OpenAI beeldgeneratie.
   - `GEMINI_API_KEY` – API-key voor Gemini tekstgeneratie.
   - `PUBLIC_SITE_URL` – Volledige URL van je Netlify site (bijv. `https://jouw-site.netlify.app`).
   - `SITE_ACTIONS_SHARED_SECRET` – Geheim voor interne API-calls en Actions.
3. Gebruik het endpoint `/.netlify/functions/story` om een verhaal en de bijbehorende afbeeldingen op te halen.
   - Voorbeeld POST-body:
   ```json
   {
     "child_first_name": "Luna",
     "age": 5,
     "theme": "maan",
     "favorite_animal": "konijn",
     "images": { "n": 2, "size": "1024x1024", "style": "watercolor" }
   }
   ```

Het antwoord bevat:
```json
{
  "ok": true,
  "story": "...",
  "images": [
    { "url": "https://...", "prompt": "..." },
    { "url": "https://...", "prompt": "..." }
  ]
}
```
De afbeeldingen kunnen worden getoond in het verhaal zelf (de eerste als cover, de rest tussen alinea's) en in marketingmateriaal (e-mails of social posts).
