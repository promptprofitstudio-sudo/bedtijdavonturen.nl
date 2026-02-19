import { NextResponse } from 'next/server'

/**
 * AU-005: Get parent count for trust signals
 * Returns the number of registered parents using the app
 */
export async function GET() {
  try {
    // TODO: Integrate with Firebase to get actual parent count
    // For now, return a mock value that increases slightly each time
    const baseCount = 2341
    const increment = Math.floor(Math.random() * 10) // Random increment 0-10
    const count = baseCount + increment

    return NextResponse.json(
      {
        count,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching parent count:', error)
    return NextResponse.json(
      { count: 2341, error: 'Failed to fetch count' },
      { status: 500 }
    )
  }
}
