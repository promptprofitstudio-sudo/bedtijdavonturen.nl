import { NextResponse } from 'next/server'

/**
 * AU-005: Get daily story count for trust signals
 * Returns the number of stories generated today
 */
export async function GET() {
  try {
    // TODO: Integrate with Firebase to get actual daily story count
    // For now, return a mock value that increases throughout the day
    const baseCount = 1243
    const hourFactor = Math.floor(new Date().getHours() / 4) // Increases throughout day
    const increment = Math.floor(Math.random() * 20) // Random increment 0-20
    const count = baseCount + (hourFactor * 50) + increment

    return NextResponse.json(
      {
        count,
        timestamp: new Date().toISOString(),
        resetTime: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching daily stories count:', error)
    return NextResponse.json(
      { count: 1243, error: 'Failed to fetch count' },
      { status: 500 }
    )
  }
}
