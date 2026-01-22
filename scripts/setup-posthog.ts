import 'dotenv/config'
import posthog from 'posthog-node'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const GOOGLE_PROJECT_ID = 'bedtijdavonturen-prod'

async function getSecret(name: string) {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${GOOGLE_PROJECT_ID}/secrets/${name}/versions/latest`,
        })
        return version.payload?.data?.toString()
    } catch (error) {
        console.warn(`Could not fetch secret ${name} from Secret Manager.`)
        return process.env[name]
    }
}

async function setupPostHog() {
    console.log('🔐 Fetching credentials from Google Secret Manager...')

    // Fetch Personal API Key (required for Dashboards API)
    // We now use the explicit 'POSTHOG_PERSONAL_API_KEY' which starts with phx_
    const PH_PERSONAL_API_KEY = await getSecret('POSTHOG_PERSONAL_API_KEY')

    // Project ID might be in env or we need to ask user if missing
    const initialProjectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || await getSecret('POSTHOG_PROJECT_ID')
    let projectId = initialProjectId

    if (!PH_PERSONAL_API_KEY) {
        console.error('❌ Missing POSTHOG_API_KEY (Personal API Key) in Secret Manager')
        process.exit(1)
    }
    if (!projectId) {
        console.log('⚠️ Project ID not found in env/secrets. Fetching from PostHog API...')
        const apiHost = 'https://eu.posthog.com' // API/UI host, not ingestion (eu.i.posthog.com)
        const projectsRes = await fetch(`${apiHost}/api/projects/`, { headers: { 'Authorization': `Bearer ${PH_PERSONAL_API_KEY}` } })

        if (projectsRes.ok) {
            const data = await projectsRes.json()
            if (data.results && data.results.length > 0) {
                const project = data.results[0]
                console.log(`✅ Found Project: ${project.name} (ID: ${project.id})`)
                projectId = project.id
            } else {
                console.error('❌ No projects found for this API Key.')
                process.exit(1)
            }
        } else {
            console.error('❌ Failed to list projects:', await projectsRes.text())
        }
    }

    if (!projectId) {
        console.error('❌ Could not determine Project ID.')
        process.exit(1)
    }

    await configureDashboard(PH_PERSONAL_API_KEY, projectId)
}

async function configureDashboard(apiKey: string, projectId: string | number) {
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    }

    const baseUrl = `https://eu.posthog.com/api/projects/${projectId}`

    console.log(`🚀 Configuring PostHog Dashboard for Project: ${projectId}...`)

    // 1. Create Dashboard
    const dashboardRes = await fetch(`${baseUrl}/dashboards/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: 'Bedtijdavonturen Health',
            description: 'Core product metrics: Funnel, Usage, Content',
            use_template: '', // Empty to start fresh
        })
    })

    if (!dashboardRes.ok) {
        const err = await dashboardRes.text()
        console.error('Failed to create dashboard:', err)
        return
    }

    const dashboard = await dashboardRes.json()
    console.log(`✅ Dashboard Created: ${dashboard.id}`)

    // 2. Add Insights to Dashboard
    const insights = [
        {
            name: 'Conversion Funnel',
            filters: {
                insight: 'FUNNELS',
                events: [
                    { id: 'wizard_started', order: 0, type: 'events' },
                    { id: 'wizard_step_completed', order: 1, type: 'events', properties: [{ key: 'step_number', value: 2, operator: 'exact' }] },
                    { id: 'story_generated', order: 2, type: 'events' },
                    { id: 'audio_generated', order: 3, type: 'events' }
                ],
                funnel_viz_type: 'steps',
                date_from: '-14d'
            }
        },
        {
            name: 'Daily Generated Stories',
            filters: {
                insight: 'TRENDS',
                events: [{ id: 'story_generated', type: 'events' }],
                date_from: '-30d',
                interval: 'day'
            }
        },
        {
            name: 'Popular Moods',
            filters: {
                insight: 'TRENDS',
                events: [{ id: 'story_generated', type: 'events' }],
                breakdown: 'mood',
                breakdown_type: 'event',
                display: 'Pie',
                date_from: '-30d'
            }
        }
    ]

    for (const insight of insights) {
        // 1. Create the Insight
        const res = await fetch(`${baseUrl}/insights/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(insight) // Create without attaching first
        })

        if (!res.ok) {
            console.error(`   - Failed to create insight ${insight.name}:`, await res.text())
            continue
        }

        const createdInsight = await res.json()
        console.log(`   + Created insight: ${insight.name} (ID: ${createdInsight.id})`)

        // 2. Explicitly Add to Dashboard
        // Using the add_to_dashboard endpoint
        // POST /api/projects/:id/insights/:insight_id/dashboard
        // OR POST /api/projects/:id/dashboards/:dashboard_id/move_tile

        // Trying the "add_to_dashboard" action often found in their internal API
        // actually for public API, updating the dashboard with existing tiles is common, 
        // BUT let's try strict relation update.

        // Strategy: We will use the 'dashboard' field in a PATCH to the insight if the initial create didn't work,
        // BUT simpler: PostHog API usually accepts 'dashboard' in creation if the token has correct scope.
        // Let's try the specific add_to_dashboard endpoint if available.

        // From research: POST /api/projects/{project_id}/insights/{insight_id}/viewed ... no

        // Let's try: PATCH /api/projects/{project_id}/insights/{insight_id}
        // with body { dashboards: [dashboard.id] }  <-- Note plural "dashboards" is common in newer systems

        // Let's try to update the insight with the dashboard array.
        const updateRes = await fetch(`${baseUrl}/insights/${createdInsight.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                dashboards: [dashboard.id]
            })
        })

        if (updateRes.ok) {
            console.log(`     -> Linked to dashboard (Method: PATCH dashboards=[])`)
        } else {
            // Fallback: Try the legacy "dashboard" field patch or checks
            console.warn(`     -> Failed to link via PATCH, trying add_to_dashboard endpoint...`)

            // Python snippet suggested: /insights/:id/add_to_dashboard
            // Body: { dashboard_id: ... }
            const addRes = await fetch(`${baseUrl}/insights/${createdInsight.id}/add_to_dashboard`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ dashboard_id: dashboard.id })
            })

            if (addRes.ok) {
                console.log(`     -> Linked to dashboard (Method: add_to_dashboard)`)
            } else {
                console.error(`     -> FAILED to link to dashboard:`, await addRes.text())
            }
        }
    }

    console.log('🎉 PostHog Configuration Complete!')
}

setupPostHog()
