'use client'

import Link from 'next/link'
import { Card, Pill } from '@/components/ui'
import { ShareButton } from '@/components/ShareButton'
import { cn } from '@/lib/utils'
import type { Story } from '@/lib/types'

export function StoryCard({ story, className }: { story: Story; className?: string }) {
  return (
    <Card className={cn('space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold leading-tight">{story.title}</h3>
          <p className="text-xs text-ink-800/70">Voor {story.childName} • {story.minutes} min</p>
        </div>
        <Pill>{story.mood}</Pill>
      </div>

      <p className="line-clamp-2 text-sm text-ink-800/80">{story.excerpt}</p>

      <div className="grid grid-cols-3 gap-2">
        <Link href={`/story/${story.id}`} className="h-10 rounded-xl bg-moon-100 text-center text-sm font-semibold leading-10 hover:bg-moon-200">
          Lees
        </Link>
        <Link
          href={story.audioUrl ? `/story/${story.id}?mode=audio` : `/story/${story.id}/generate-audio`}
          className="h-10 rounded-xl bg-moon-100 text-center text-sm font-semibold leading-10 hover:bg-moon-200"
        >
          Luister
        </Link>
        <ShareButton storyId={story.id} userId={story.userId} />
      </div>
    </Card >
  )
}
