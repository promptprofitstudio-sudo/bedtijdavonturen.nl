
import { PostHog } from 'posthog-node'

// Usage: ts-node scripts/update-posthog-dashboard.ts <PERSONAL_API_KEY>

const PERSONAL_API_KEY = process.argv[2]

if (!PERSONAL_API_KEY) {
    console.error("Please provide your PostHog Personal API Key as an argument.")
    process.exit(1)
}

async function main() {
    console.log("🚀 Updating PostHog Dashboard to v2.0...")
    const baseUrl = 'https://app.posthog.com/api/projects'
    const headers = {
        'Authorization': `Bearer ${PERSONAL_API_KEY}`,
        'Content-Type': 'application/json'
    }

    try {
        const projectsRes = await fetch(`${baseUrl}`, { headers })
        const projects = await projectsRes.json()

        if (!projects.results || projects.results.length === 0) {
            console.error("No projects found.")
            return
        }

        const projectId = projects.results[0].id
        console.log(`Using Project ID: ${projectId}`)

        // Create Dashboard
        const dashboardPayload = {
            name: "Bedtijd Avonturen v2.0 Overview 🚀",
            description: "Auto-generated dashboard for v2.0 features",
            filters: {}
        }

        const createRes = await fetch(`${baseUrl}/${projectId}/dashboards`, {
            method: 'POST',
            headers,
            body: JSON.stringify(dashboardPayload)
        })

        if (!createRes.ok) {
            console.error("Failed to create dashboard", await createRes.text())
        } else {
            console.log("✅ Dashboard Created Successfully!")
        }

    } catch (e) {
        console.error("Error:", e)
    }
}

main()
