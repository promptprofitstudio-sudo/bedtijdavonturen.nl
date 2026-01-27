import { getSecret } from '../src/lib/secrets'

const API_HOST = 'https://eu.posthog.com'
const DASHBOARD_NAME = "Bedtijd Avonturen v2.0 Metrics (EU) 🚀"

async function main() {
    console.log("🔍 Inspecting Dashboard...")
    const apiKey = await getSecret('POSTHOG_PERSONAL_API_KEY')
    const headers = { 'Authorization': `Bearer ${apiKey}` }

    // Get Project
    const orgRes = await fetch(`${API_HOST}/api/organizations/@current`, { headers })
    const orgData = await orgRes.json()
    const projectId = (await (await fetch(`${API_HOST}/api/organizations/${orgData.id}/projects/`, { headers })).json()).results[0].id
    const BASE_URL = `${API_HOST}/api/projects/${projectId}`

    // Get Dashboard
    const dashRes = await fetch(`${BASE_URL}/dashboards/?limit=100`, { headers })
    const targetDash = (await dashRes.json()).results.find((d: any) => d.name === DASHBOARD_NAME)

    if (!targetDash) {
        console.error("Dashboard not found")
        process.exit(1)
    }

    // Get Tiles
    const detailed = await (await fetch(`${BASE_URL}/dashboards/${targetDash.id}/`, { headers })).json()
    const tiles = detailed.tiles || []

    console.log(`Found ${tiles.length} tiles:`)
    tiles.forEach((t: any) => {
        const i = t.insight || {}
        console.log(`\n🔹 [${t.id}] Name: ${i.name} (Insight ID: ${i.id})`)
        console.log(`   Filters:`, JSON.stringify(i.filters, null, 2))
    })
}

main()
