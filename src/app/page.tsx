import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui'

export default function HomePage() {
  return (
    <main className="bg-background-light dark:bg-background-dark text-[#141118] dark:text-white transition-colors duration-300 overflow-x-hidden min-h-screen font-display">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined !text-[20px]">auto_stories</span>
            </div>
            <h2 className="text-[#141118] dark:text-white text-lg font-extrabold leading-tight tracking-tight">Bedtijdavonturen</h2>
          </div>
          <Link href="/wizard">
            <button className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-full transition-all active:scale-95">
              START
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="p-4 pt-2">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-purple-900/40 dark:to-indigo-900/40 p-8 min-h-[580px] flex flex-col items-center text-center gap-8 border border-orange-100 dark:border-purple-500/20 shadow-xl shadow-orange-100/50 dark:shadow-none">

          <div className="flex flex-col gap-4 relative z-10 max-w-sm mx-auto">
            <div className="inline-flex items-center self-center gap-2 bg-white/80 dark:bg-white/10 px-3 py-1 rounded-full border border-orange-200 dark:border-purple-400/30">
              <span className="material-symbols-outlined text-primary !text-sm">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">100% Kindvriendelijk & Veilig</span>
            </div>
            <h1 className="text-[#141118] dark:text-white text-[2.5rem] font-black leading-[1.1] tracking-[-0.03em]">
              Jouw rustige avondritueel begint hier.
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-relaxed">
              Een nieuw slaapverhaal, klaar voordat je koffie afkoelt. Echt.
            </p>
          </div>

          {/* Audio Player Visual Placeholder */}
          <div className="w-full max-w-[300px] bg-white dark:bg-white/10 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined !text-2xl">play_arrow</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 w-3/4 bg-gray-200 dark:bg-white/20 rounded-full"></div>
              <div className="h-2 w-1/2 bg-gray-100 dark:bg-white/10 rounded-full"></div>
            </div>
          </div>

          <div className="w-full max-w-[280px] space-y-3">
            <Link href="/wizard">
              <button className="w-full bg-primary text-white h-14 rounded-2xl text-lg font-extrabold shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-primary/90">
                <span>Maak gratis een verhaal</span>
                <span className="material-symbols-outlined">auto_fix_high</span>
              </button>
            </Link>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Geen account nodig • Gratis proberen</p>
          </div>
        </div>
      </section>

      {/* Feature: Kies je Modus */}
      <section className="px-4 py-8 max-w-lg mx-auto">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl font-black text-[#141118] dark:text-white">Kies de perfecte toon</h2>
          <p className="text-gray-500 text-sm">Elke leeftijd vraagt om een ander verhaal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/30 transition-colors border-2 border-transparent">
            <div className="text-3xl mb-3">🧸</div>
            <h3 className="font-extrabold text-lg text-[#141118]">2-4 Jaar</h3>
            <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">Veilig & Vertrouwd</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Korte zinnen, veel herhaling en herkenbare situaties. Speciaal ontworpen voor peuters.
            </p>
          </Card>

          <Card className="hover:border-primary/30 transition-colors border-2 border-transparent">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-extrabold text-lg text-[#141118]">4-7 Jaar</h3>
            <p className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">Avontuur & Emotie</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Jouw kind is de held die problemen oplost. Spannend, maar altijd met een goede afloop.
            </p>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-12 bg-accent-orange/10 dark:bg-white/5 my-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center text-orange-400 gap-1">
            {'★★★★★'.split('').map((s, i) => <span key={i} className="text-xl">{s}</span>)}
          </div>
          <p className="text-xl font-bold font-serif italic text-gray-700 dark:text-gray-200 leading-relaxed">
            &ldquo;Eerst was bedtijd een strijd, nu vraagt Luuk (5) zelf om &apos;de uil&apos;. Binnen 5 minuten is hij vertrokken. Echt een aanrader!&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6bbBVRCAAVnM1UaAZeQBDBgsnQ7TGNQlVFfhKdXKIHEw19jBpO63n5j45H1kC9JSlqab9vLJUL0XhTNI10SHZj59gDn2pwc-c2KlIIOr5r8wI3DnvrK6WZs0iYW2_LPRZU706d9Xy0WOzwvoG7hLksUJXXHpQ77xqUAmzlJ4iHqSSv6zMqrBElx6SG3wKLMAqxaMYsIqspBtc3iDXNh8epHb8FpBnLVvylCyRuceT498w_2kuB1x8yI3IxJIeBizzTDkKdrsPi4s" alt="Sanne" className="object-cover w-full h-full" />
            </div>
            <div className="text-left">
              <p className="text-sm font-extrabold text-[#141118] dark:text-white">Sanne</p>
              <p className="text-xs text-gray-500 font-bold uppercase">Moeder van Luuk</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="px-4 pb-24 text-center">
        <p className="text-sm text-gray-500 font-medium mb-3">Flexibiliteit staat voorop</p>
        <Link href="/pricing" className="inline-block text-primary font-bold hover:underline">
          Kies voor een abonnement of een losse Weekend Bundel (€1,99) &rarr;
        </Link>
      </section>

      {/* Footer Links (Legal) */}
      <Footer />
    </main>
  )
}
