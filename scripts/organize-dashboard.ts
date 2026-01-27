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

    // 3. Definitions
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

    console.log("🧹 Syncing insights...")
    const allInsights = (await (await fetch(`${BASE_URL}/insights/?limit=200`, { headers })).json()).results

    for (const def of definitions) {
        console.log(`Processing: ${def.name}...`)
        const matches = allInsights.filter((i: any) => i.name === def.name || i.name === def.name + " (Copy)")

        let primaryInsightId = null
        if (matches.length > 0) {
            primaryInsightId = matches[0].id
            console.log(`   Found existing ID: ${primaryInsightId}`)
            await fetch(`${BASE_URL}/insights/${primaryInsightId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ filters: def.filter, dashboards: [targetDash.id] })
            })
            // Delete duplicates
            for (let i = 1; i < matches.length; i++) {
                console.log(`   🗑️ Deleting duplicate insight: ${matches[i].id}`)
                await fetch(`${BASE_URL}/insights/${matches[i].id}`, { method: 'DELETE', headers })
            }
        } else {
            console.log(`   ✨ Creating new...`)
            const res = await fetch(`${BASE_URL}/insights/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: def.name, filters: def.filter, dashboards: [targetDash.id] })
            })
            primaryInsightId = (await res.json()).id
        }
    }

    // 4. Aggressive Deduplication on Dashboard Level
    console.log("🔥 Deduplicating Tiles on Dashboard...")
    const finalDash = await (await fetch(`${BASE_URL}/dashboards/${targetDash.id}/`, { headers })).json()
    const currentTiles = finalDash.tiles || []
    const tileGroups: Record<string, any[]> = {}

    currentTiles.forEach((t: any) => {
        const name = t.insight?.name || "Untitled"
        if (!tileGroups[name]) tileGroups[name] = []
        tileGroups[name].push(t)
    })

    for (const [name, tiles] of Object.entries(tileGroups)) {
        if (tiles.length > 1) {
            console.log(`   Found ${tiles.length} copies of '${name}'. Keeping the last one.`)
            const toRemove = tiles.slice(0, tiles.length - 1)
            for (const t of toRemove) {
                console.log(`     🗑️ Removing tile ID: ${t.id}`)
                // In PostHog, deleting an insight generally removes it from dashboard.
                if (t.insight?.id) {
                    await fetch(`${BASE_URL}/insights/${t.insight.id}`, { method: 'DELETE', headers })
                }
            }
        }
    }
    console.log("✅ Dashboard Reorganized.")
}

main()
