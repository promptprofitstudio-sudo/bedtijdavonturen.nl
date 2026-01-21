import Link from 'next/link'

export function Footer() {
    return (
        <footer className="px-4 py-8 mt-8 text-center border-t border-moon-100 bg-moon-50/50">
            <div className="flex justify-center gap-4 text-xs font-semibold text-navy-600 mb-2">
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <Link href="/terms" className="hover:underline">Voorwaarden</Link>
            </div>
            <div className="text-[10px] text-ink-400 leading-relaxed">
                <p>&copy; {new Date().getFullYear()} Korpershoek Management B.V.</p>
                <p>KvK 51502062 &bull; Almere</p>
            </div>
        </footer>
    )
}
