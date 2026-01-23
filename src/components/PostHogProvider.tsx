'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

        if (key) {
            posthog.init(key, {
                api_host: host,
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: true,
                opt_out_capturing_by_default: true, // Wait for consent
                persistence: 'localStorage+cookie',
            })

            // Check existing consent
            const consent = localStorage.getItem('cookie_consent')
            if (consent === 'true') {
                posthog.opt_in_capturing()
            } else if (consent === 'false') {
                posthog.opt_out_capturing()
            }
        }
    }, [])

    return (
        <PHProvider client={posthog}>
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </PHProvider>
    )
}

// Import dynamically to avoid SSR issues if strictly needed, but client component is usually fine.
// We'll import the separate component we just made.
import PostHogPageView from './PostHogPageView'
import { Suspense } from 'react'
