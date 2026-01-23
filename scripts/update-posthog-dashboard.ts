
import { getSecret } from '../src/lib/secrets'

async function main() {
    console.log("🚀 Updating PostHog Dashboard to v2.0...")

    // 1. Fetch Key
    const apiKey = await getSecret('POSTHOG_PERSONAL_API_KEY')
    if (!apiKey) {
        console.error("❌ Key not found in Secrets. Please set POSTHOG_PERSONAL_API_KEY")
        process.exit(1)
    }

    // 2. Get Project ID from Args
    const manualProjectId = process.argv[2]

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    }

    let projectId = manualProjectId

    if (!projectId) {
        console.log("⚠️ No Project ID provided. Fetching from EU Cloud...")
        try {
            const projectsRes = await fetch('https://eu.posthog.com/api/projects', { headers })
            if (!projectsRes.ok) throw new Error(`Fetch failed: ${projectsRes.statusText}`)
            const projects = await projectsRes.json()
            projectId = projects.results[0].id
        } catch (e) {
            console.error("❌ Could not auto-discover Project ID (EU).")
            console.error("👉 Please run: npx tsx scripts/update-posthog-dashboard.ts <PROJECT_ID>")
            process.exit(1)
        }
    }

    console.log(`Using Project ID: ${projectId}`)

    // 3. CREATE DASHBOARD
    console.log("Creating Dashboard on EU Cloud...")
    const dashPayload = {
        name: "Bedtijd Avonturen v2.0 Metrics (EU) 🚀",
        description: "Live V2.0 Tracking: Voice, Share, PWA, Billing",
        pinned: true
    }

    try {
        const dashRes = await fetch(`https://eu.posthog.com/api/projects/${projectId}/dashboards`, {
            method: 'POST',
            headers,
            body: JSON.stringify(dashPayload)
        })

        if (!dashRes.ok) {
            console.error("Failed to create dashboard:", await dashRes.text())
            process.exit(1)
        }

        const dashboard = await dashRes.json()
        const dashId = dashboard.id
        console.log(`✅ Dashboard Created: ${dashId}`)

        // 4. CREATE INSIGHTS (Attached to Dashboard)
        const insights = [
            { name: "Voice Clones Created", event: "voice_cloned" },
            { name: "Share Links Created", event: "share_link_created" },
            { name: "Checkouts Started", event: "checkout_started" },
            { name: "PWA Install Clicks", event: "pwa_install_clicked" }
        ]

        for (const item of insights) {
            console.log(`Creating Insight: ${item.name}...`)
            const insightPayload = {
                name: item.name,
                dashboard: dashId,
                filters: {
                    insight: "TRENDS",
                    events: [{ id: item.event, name: item.event, type: "events", order: 0 }],
                    date_from: "-30d",
                    display: "BoldNumber"
                }
            }

            const insightRes = await fetch(`https://eu.posthog.com/api/projects/${projectId}/insights`, {
                method: 'POST',
                headers,
                body: JSON.stringify(insightPayload)
            })

            if (!insightRes.ok) {
                console.error(`Failed to create insight ${item.name}:`, await insightRes.text())
            } else {
                console.log(`✅ Insight Created: ${item.name}`)
            }
        }

        console.log(`🎉 All Done! Visit PostHog -> Dashboards`)

    } catch (e) {
        console.error("API Error:", e)
    }
}

main()
