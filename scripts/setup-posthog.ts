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
        const res = await fetch(`${baseUrl}/insights/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ...insight,
                dashboard: dashboard.id
            })
        })

        if (res.ok) {
            console.log(`   + Added insight: ${insight.name}`)
        } else {
            console.error(`   - Failed to add ${insight.name}:`, await res.text())
        }
    }

    console.log('🎉 PostHog Configuration Complete!')
}

setupPostHog()
