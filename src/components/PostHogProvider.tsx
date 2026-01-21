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
                capture_pageview: false, // Manually capture pageviews if using Next.js router events, but for App Router default is okay-ish, or use a PageView tracker. 
                // Creating a separate PageView component is cleaner for App Router. Let's start basic.
                capture_pageleave: true,
            })
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
