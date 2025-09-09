import { json, geminiGenerate, callInternalFunction } from "./_common.js"

/**
 * POST /.netlify/functions/story
 * Body: { child_first_name, age, theme, favorite_animal, images: { n, size, style } }
 * Returns: { ok:true, story, images:[{url, prompt}] }
 */
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, {error:"POST required"})
  const { child_first_name="", age=5, theme="maan", favorite_animal="knuffelbeer", images={} } = JSON.parse(event.body || "{}")

  const storyPrompt = `Schrijf een kalmerend Nederlands bedtijdverhaal (~900 woorden) voor een kind van ${age}.\nNaam van het kind: ${child_first_name}.\nThema: ${theme}. Lievelingsdier: ${favorite_animal}.\nStijl: warm, rustig, positief, met heldere maar zachte beelden. Korte alinea's (2-4 zinnen), eenvoudige woorden.\nEindig met een zachtaardige afsluiting die uitnodigt om de ogen te sluiten.`

  const story = await geminiGenerate({prompt: storyPrompt})

  // Auto-generate images via internal call
  const imgPayload = {
    child_first_name, theme, favorite_animal,
    n: images?.n ?? 1,
    size: images?.size ?? "1024x1024",
    style: images?.style ?? "storybook"
  }
  const imgRes = await callInternalFunction("/.netlify/functions/images", { method:"POST", payload: imgPayload })

  return json(200, { ok: true, story, images: imgRes.images || [] })
}
