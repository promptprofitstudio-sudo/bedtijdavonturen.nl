import { getSecret } from '../src/lib/secrets'

// CONFIG
const API_HOST = 'https://eu.posthog.com'
const TARGET_DASHBOARD_NAME = "Bedtijd Avonturen v2.0 Metrics (EU) 🚀"

async function main() {
    console.log("🚀 Merging PostHog Dashboards...")

    // 1. Auth & Project ID
    const apiKey = await getSecret('POSTHOG_PERSONAL_API_KEY')
    if (!apiKey) {
        console.error("❌ Key not found in Secrets/Env.")
        process.exit(1)
    }

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    }

    // Auto-discover Project ID (Organization-first approach)
    let projectId: string | null = null;
    try {
        const orgRes = await fetch(`${API_HOST}/api/organizations/@current`, { headers })
        const orgData = await orgRes.json()
        const orgId = orgData.id

        const projectsRes = await fetch(`${API_HOST}/api/organizations/${orgId}/projects/`, { headers })
        const projects = await projectsRes.json()
        projectId = projects.results?.[0]?.id

        if (!projectId) throw new Error("No projects found")
    } catch (e) {
        console.error("Failed to discover project:", e)
        process.exit(1)
    }

    console.log(`Using Project ID: ${projectId}`)
    const BASE_URL = `${API_HOST}/api/projects/${projectId}`

    // 2. Find Dashboards
    const dashRes = await fetch(`${BASE_URL}/dashboards/?limit=100`, { headers })
    const dashData = await dashRes.json()
    const allDashboards = dashData.results || []

    const targetDashboard = allDashboards.find((d: any) => d.name === TARGET_DASHBOARD_NAME)

    if (!targetDashboard) {
        console.error(`❌ Target dashboard '${TARGET_DASHBOARD_NAME}' not found. Run update-posthog-dashboard.ts first.`)
        process.exit(1)
    }

    console.log(`🎯 Target Dashboard: ${targetDashboard.name} (ID: ${targetDashboard.id})`)

    // 3. Iterate Other Dashboards & Move Tiles
    const otherDashboards = allDashboards.filter((d: any) => d.id !== targetDashboard.id)

    if (otherDashboards.length === 0) {
        console.log("No other dashboards to merge.")
    }

    for (const dash of otherDashboards) {
        console.log(`\n📦 Processing source dashboard: ${dash.name} (${dash.id})...`)

        // Fetch detailed dashboard (to get tiles/insights)
        // Note: The list endpoint might not return items. We fetch specific.
        const detailRes = await fetch(`${BASE_URL}/dashboards/${dash.id}/`, { headers })
        const detail = await detailRes.json()

        // In recent PostHog API, tiles/insights are linked via 'dashboards' property on the insight, 
        // OR accessible via /dashboards/:id return object 'tiles'.

        const tiles = detail.tiles || []
        console.log(`   Found ${tiles.length} tiles.`)

        for (const tile of tiles) {
            if (tile.insight) {
                console.log(`   - Moving Insight: ${tile.insight.name || 'Untitled'} (${tile.insight.id})`)

                // Update Insight to point to Target Dashboard
                // We APPEND the target dashboard ID to ensure valid PATCH
                // Actually, to "Move", we replace the old dashboard ID with the new one.
                // But safer to just ADD it first.
                // Wait, tile.insight might not have the full object.

                // Let's PATCH the insight directly.
                const insightPatch = await fetch(`${BASE_URL}/insights/${tile.insight.id}/`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        dashboards: [targetDashboard.id] // Force move!
                    })
                })

                if (insightPatch.ok) {
                    console.log(`     ✅ Moved.`)
                } else {
                    console.error(`     ❌ Failed to move:`, await insightPatch.text())
                }
            }
        }
    }

    // 4. Fix "Missing/Orphaned" Insights
    // List all insights and check if they match our known metrics but aren't on the target dashboard
    console.log("\n🧹 Scanning for orphaned metrics...")

    const knownMetricNames = [
        "Voice Clones Created",
        "Share Links Created",
        "Checkouts Started",
        "PWA Install Clicks"
    ]

    const insightsRes = await fetch(`${BASE_URL}/insights/?limit=100`, { headers })
    const insightsData = await insightsRes.json()
    const allInsights = insightsData.results || []

    for (const insight of allInsights) {
        if (knownMetricNames.includes(insight.name)) {
            // Check if it belongs to target dashboard
            const isOnTarget = insight.dashboards && insight.dashboards.includes(targetDashboard.id)

            if (!isOnTarget) {
                console.log(`   - Found orphaned metric: ${insight.name} (${insight.id}). Linking to Target...`)
                const linkRes = await fetch(`${BASE_URL}/insights/${insight.id}/`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        dashboards: [targetDashboard.id]
                    })
                })
                if (linkRes.ok) console.log("     ✅ Linked.")
            }
        }
    }

    console.log("\n🎉 Merge Complete.")
}

main()
