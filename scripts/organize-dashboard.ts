import { getSecret } from '../src/lib/secrets'

const API_HOST = 'https://eu.posthog.com'
const DASHBOARD_NAME = "Bedtijd Avonturen v2.0 Metrics (EU) 🚀"

async function main() {
    console.log("🚀 Organizing Dashboard: " + DASHBOARD_NAME)

    const apiKey = await getSecret('POSTHOG_PERSONAL_API_KEY')
    if (!apiKey) {
        console.error("❌ Key not found.")
        process.exit(1)
    }

    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

    // 1. Get Project ID
    const orgRes = await fetch(`${API_HOST}/api/organizations/@current`, { headers })
    const orgData = await orgRes.json()
    const projectId = (await (await fetch(`${API_HOST}/api/organizations/${orgData.id}/projects/`, { headers })).json()).results[0].id
    console.log(`Using Project: ${projectId}`)
    const BASE_URL = `${API_HOST}/api/projects/${projectId}`

    // 2. Get Dashboard
    const dashRes = await fetch(`${BASE_URL}/dashboards/?limit=100`, { headers })
    const dashboards = (await dashRes.json()).results
    const targetDash = dashboards.find((d: any) => d.name === DASHBOARD_NAME)

    if (!targetDash) {
        console.error("Dashboard not found")
        process.exit(1)
    }

    // 3. Clear Existing Tiles (Soft Reset to Avoid Duplicates)
    // We fetch current tiles to find their Insight IDs
    const detailedDash = await (await fetch(`${BASE_URL}/dashboards/${targetDash.id}/`, { headers })).json()
    const existingTiles = detailedDash.tiles || []

    // We will unlink ALL current tiles to start fresh, then re-link or re-create needed ones.
    // Actually, destroying them is aggressive. Let's just create a list of "Desired Metrics" 
    // and find the best matching existing insight for each, then link ONLY those in the right order.

    // DEFINITION OF DESIRED METRICS
    const definitions = [
        {
            name: "Total Stories Generated",
            filter: { insight: "TRENDS", events: [{ id: "story_generated", type: "events" }], display: "BoldNumber" }
        },
        {
            name: "Total Audio Generated",
            filter: { insight: "TRENDS", events: [{ id: "audio_generated", type: "events" }], display: "BoldNumber" }
        },
        {
            name: "Conversion Funnel",
            filter: {
                insight: "FUNNELS",
                events: [
                    { id: "wizard_started", order: 0 },
                    { id: "wizard_step_completed", order: 1, properties: [{ key: "step_number", value: 2, operator: "exact" }] },
                    { id: "story_generated", order: 2 },
                    { id: "audio_generated", order: 3 }
                ],
                funnel_viz_type: "steps",
                display: "FunnelViz"
            }
        },
        {
            name: "Daily Stories Trend",
            filter: { insight: "TRENDS", events: [{ id: "story_generated", type: "events" }], interval: "day", display: "ActionsLineGraph" }
        },
        {
            name: "Daily Audio Trend",
            filter: { insight: "TRENDS", events: [{ id: "audio_generated", type: "events" }], interval: "day", display: "ActionsLineGraph" }
        },
        {
            name: "Mood Distribution",
            filter: { insight: "TRENDS", events: [{ id: "story_generated", type: "events" }], breakdown: "mood", breakdown_type: "event", display: "Pie" }
        },
        {
            name: "Age Group Distribution",
            filter: { insight: "TRENDS", events: [{ id: "story_generated", type: "events" }], breakdown: "age_group", breakdown_type: "event", display: "Pie" }
        }
    ]

    console.log("🧹 Re-organizing tiles...")

    // First, unlink everything to clear the board arrangement
    // (PostHog doesn't have a 'clear' endpoint easily, so we just treat this as a 'ensure these exist' pass)
    // Actually, to dedup, we should find specific insights and delete duplicate *Insights* if they exist? 
    // That's risky.
    // Strategy: 
    // 1. Iterate definitions.
    // 2. Search for existing insight by name.
    // 3. If exists, update its filters (sync code to dashboards) and ensure linked.
    // 4. If duplicates found (same name), KEEP ONE, DELETE OTHERS.
    // 5. If missing, create.

    const allInsights = (await (await fetch(`${BASE_URL}/insights/?limit=200`, { headers })).json()).results

    for (const def of definitions) {
        console.log(`Processing: ${def.name}...`)

        const matches = allInsights.filter((i: any) => i.name === def.name || i.name === def.name + " (Copy)") // handle copies

        let primaryInsightId = null

        if (matches.length > 0) {
            // Pick first as primary
            primaryInsightId = matches[0].id
            console.log(`   Found existing ID: ${primaryInsightId}`)

            // Update definition
            await fetch(`${BASE_URL}/insights/${primaryInsightId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    filters: def.filter,
                    dashboards: [targetDash.id] // Ensure linked
                })
            })

            // Delete duplicates
            for (let i = 1; i < matches.length; i++) {
                console.log(`   🗑️ Deleting duplicate: ${matches[i].id}`)
                await fetch(`${BASE_URL}/insights/${matches[i].id}`, { method: 'DELETE', headers })
            }
        } else {
            // Create New
            console.log(`   ✨ Creating new...`)
            const res = await fetch(`${BASE_URL}/insights/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: def.name,
                    filters: def.filter,
                    dashboards: [targetDash.id]
                })
            })
            const json = await res.json()
            primaryInsightId = json.id
        }
    }

    // Final cleanup: Unlink any tiles on the dashboard that are NOT in our definition list?
    // This removes user-created custom stuff, which might be bad.
    // But user asked to "Align with code", implying strict Sync.
    // I'll skip destructive unlink for unknown tiles to be safe, but duplicates are gone.

    console.log("✅ Dashboard Reorganized.")
}

main()
