import { json, requireSecret } from "./_common.js"

/**
 * POST /.netlify/functions/images
 * Body: { child_first_name, theme, favorite_animal, n=1, size="1024x1024", style="storybook|watercolor|pastel" }
 * Returns: { ok:true, images:[ {url, prompt} ] }
 */
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, {error:"POST required"})
  // Optional internal auth (uncomment to require)
  // try { requireSecret(event) } catch (e) { return json(401, {error: e.message}) }

  const { child_first_name, theme, favorite_animal, n=1, size="1024x1024", style="storybook" } = JSON.parse(event.body || "{}")

  const styleMap = {
    storybook: "whimsical bedtime storybook, soft edges, subtle texture, cozy lighting",
    watercolor: "soft watercolor wash, gentle gradients, painterly textures",
    pastel: "warm pastel palette, grainy paper texture, soothing contrasts"
  }
  const styleHint = styleMap[style] || styleMap.storybook

  const prompt = `Whimsical, child-safe bedtime illustration in Dutch children's book style. \n- Character: ${child_first_name} with ${favorite_animal}\n- Setting/theme: ${theme}, dreamy night sky, cozy bedroom elements\n- Art direction: ${styleHint}\n- Composition: cover-ready, centered subject, generous margins\n- Ethics/privacy: no realistic faces, no brand logos, no text`

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: Math.min(Math.max(parseInt(n,10)||1,1), 4),
      size
    })
  })

  if (!resp.ok) {
    const t = await resp.text()
    return json(500, {error: "Image generation failed", details: t})
  }

  const data = await resp.json()
  const images = (data.data || []).map(d => ({ url: d.url, prompt }))

  return json(200, { ok: true, images })
}
