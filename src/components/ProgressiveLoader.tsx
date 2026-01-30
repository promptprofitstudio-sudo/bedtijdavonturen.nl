import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'

const messages = [
    "De magische wereld wordt geopend...",
    "Even kijken of de sterren goed hangen...",
    "Het verhaal wordt geschreven..."
]

export function ProgressiveLoader() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(i => (i + 1) % messages.length)
        }, 3000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="w-full text-center space-y-4 py-8">
            <div className="animate-spin text-4xl mb-2">✨</div>
            <p className="text-lg font-bold text-navy-900 animate-pulse transition-all duration-500">
                {messages[index]}
            </p>
            <p className="text-xs text-navy-800/50">Dit duurt ongeveer 10 seconden</p>
        </div>
    )
}
