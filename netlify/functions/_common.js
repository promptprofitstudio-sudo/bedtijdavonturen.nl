// Common helpers for Netlify Functions
export const json = (status, data) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data)
})

export const requireSecret = (event) => {
  const expected = process.env.SITE_ACTIONS_SHARED_SECRET
  const got = event.headers["x-site-secret"] || event.headers["X-Site-Secret"]
  if (!expected || got !== expected) {
    throw new Error("Unauthorized: missing or invalid X-Site-Secret")
  }
}

/**
 * Call another Netlify function in the same site, passing the shared secret.
 * path should be like '/.netlify/functions/images'
 */
export async function callInternalFunction(path, {method='POST', payload=null}={}) {
  const base = process.env.PUBLIC_SITE_URL || ''
  const url = base ? new URL(path, base).toString() : path
  const headers = { "Content-Type": "application/json", "X-Site-Secret": process.env.SITE_ACTIONS_SHARED_SECRET || "" }
  const body = payload ? JSON.stringify(payload) : undefined
  const resp = await fetch(url, { method, headers, body })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`Internal call failed ${path}: ${t}`)
  }
  return await resp.json()
}

// Minimal Gemini text generation
export async function geminiGenerate({prompt}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`
  const payload = { contents: [ { parts: [ { text: prompt } ] } ] }
  const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error("Gemini error: " + t)
  }
  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
  return text
}
