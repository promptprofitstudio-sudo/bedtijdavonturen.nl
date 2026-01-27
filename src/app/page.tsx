import Link from 'next/link'
import { Footer } from '@/components/Footer'

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
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-purple-900/40 dark:to-indigo-900/40 p-6 min-h-[520px] flex flex-col items-center justify-center text-center gap-8 border border-orange-200/50 dark:border-purple-500/20 shadow-xl shadow-orange-100/50 dark:shadow-none">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 opacity-30 animate-pulse">
            <span className="material-symbols-outlined text-orange-400 !text-4xl">star</span>
          </div>
          <div className="absolute bottom-10 right-4 opacity-30 animate-pulse">
            <span className="material-symbols-outlined text-purple-400 !text-5xl">rocket_launch</span>
          </div>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="inline-flex items-center self-center gap-2 bg-white/80 dark:bg-white/10 px-3 py-1 rounded-full border border-orange-200 dark:border-purple-400/30">
              <span className="material-symbols-outlined text-primary !text-sm">magic_button</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Nieuw: Ontdek de magie</span>
            </div>
            <h1 className="text-[#141118] dark:text-white text-4xl font-black leading-[1.1] tracking-[-0.04em]">
              Maak van bedtijd het fijnste moment van de dag
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-relaxed max-w-[280px] mx-auto">
              Geen strijd, maar samen verdwalen in een avontuur. Geef je kind de hoofdrol in een verhaal dat rust en vertrouwen brengt.
            </p>
          </div>

          {/* Illustration Placeholder Container */}
          <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 p-2 shadow-inner overflow-hidden relative group">
            <img
              alt="Ouder en kind genieten van een rustig voorleesmoment"
              className="w-full h-full object-cover rounded-xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv_IYXzSqgpArINPX55jYhlaxwTDpyvAxuhnKxtKVoNwlQz1DNCognSvpGoX8PeSRvOccsBB0VAj5lUwzcKtV12EiQd_FsvRJLkG4cYuWxSIcHYByD85j42QcsLOJWyTfvw8AP2E5LM6cZV2bUkIik3F7QRKGiyhvPY16VcrkMCwuRDCHK3AOlCOo5XO9ZDQGWsrwTQ2Y0TGQ5AS8L-qf4ctcsZ_3rne1uVFiktkMWf7aCzenMhw6DFBg7KNf-BuiZSAWXty-a4w"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-200/40 to-transparent pointer-events-none"></div>
          </div>

          <Link href="/wizard" className="w-full max-w-[280px]">
            <button className="w-full bg-primary text-white h-14 rounded-2xl text-lg font-extrabold shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span>Start het avontuur</span>
              <span className="material-symbols-outlined">auto_fix_high</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <div className="flex justify-center items-center gap-4 py-6">
        <div className="flex -space-x-3">
          <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background-dark" alt="Vader avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIsYcGnWkiPtyUEydETugcQEFPz3vudlVP32GCdT4SnxO-bD7C__Blt5sKczk0ueh8ANxPueOHZimRF21qIeycI3g8a-VvCcrGZ9C77H6-VL1YnMs0osfITxDZDYUVj2pqH5baOlTu4bt2OzK5OhqNnbLW59-QA3d5lWHqtN8JfveCBiq8LG0gHeglUQgjhszhwggoyk2NvKhiLtH1r51r5Df9BPJJV4mndOh-9WD71UVFhxLG7EtCEO_frd08K1AEY-tQ2oXf1Zw" />
          <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background-dark" alt="Moeder avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYwbDhnV2muxvEQm-7fDdYMMlwcPMoGGAA5jG_sGlLNPyiDlsAStzer9KuBqBYUiWL80MetJ8gicm0xrvug3DOGovDzWY8G2MwzqlzVkcQQvFOQ0uM42EfSbAAtwXYA2cMLIm5U5OXeeCsxdEJ9D0O7pmdWA1wqiNrQNp1EsWf57_MA6v5JwRHt6hdAwKwbwCepibc1wUk5NVx3iEMquTGO6mXClApYRBmzvjBS-F2rDg6I8Noy0Yx-YPLuXuLaft9GNrBI3Wfenk" />
          <img className="w-8 h-8 rounded-full border-2 border-white dark:border-background-dark" alt="Ouder avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6bbBVRCAAVnM1UaAZeQBDBgsnQ7TGNQlVFfhKdXKIHEw19jBpO63n5j45H1kC9JSlqab9vLJUL0XhTNI10SHZj59gDn2pwc-c2KlIIOr5r8wI3DnvrK6WZs0iYW2_LPRZU706d9Xy0WOzwvoG7hLksUJXXHpQ77xqUAmzlJ4iHqSSv6zMqrBElx6SG3wKLMAqxaMYsIqspBtc3iDXNh8epHb8FpBnLVvylCyRuceT498w_2kuB1x8yI3IxJIeBizzTDkKdrsPi4s" />
        </div>
        <div className="flex flex-col">
          <div className="flex gap-0.5 text-yellow-400">
            <span className="material-symbols-outlined !text-[16px]">star</span>
            <span className="material-symbols-outlined !text-[16px]">star</span>
            <span className="material-symbols-outlined !text-[16px]">star</span>
            <span className="material-symbols-outlined !text-[16px]">star</span>
            <span className="material-symbols-outlined !text-[16px]">star</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">1200+ ouders kozen voor rust</p>
        </div>
      </div>

      {/* How It Works */}
      <section className="bg-accent-orange dark:bg-purple-900/10 py-12 px-6 rounded-[2.5rem] my-8 mx-2 border border-orange-100 dark:border-purple-800/20">
        <h4 className="text-primary text-sm font-black leading-normal tracking-[0.2em] uppercase text-center mb-10">ZO WERKT HET</h4>
        <div className="flex flex-col gap-10">
          {/* Step 1 */}
          <div className="flex gap-5 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-purple-800 shadow-sm border border-orange-100 dark:border-purple-700 flex items-center justify-center text-primary font-black text-xl">
              <span className="material-symbols-outlined">palette</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#141118] dark:text-white text-lg font-extrabold leading-tight mb-1">Kies een wereld</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Waar wil je kind vandaag naartoe? Van jungle tot ruimtereis.</p>
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex gap-5 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-purple-800 shadow-sm border border-orange-100 dark:border-purple-700 flex items-center justify-center text-primary font-black text-xl">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#141118] dark:text-white text-lg font-extrabold leading-tight mb-1">Jouw kind in de hoofdrol</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Vul de naam in en zie de ogen gaan stralen van herkenning.</p>
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex gap-5 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-purple-800 shadow-sm border border-orange-100 dark:border-purple-700 flex items-center justify-center text-primary font-black text-xl">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#141118] dark:text-white text-lg font-extrabold leading-tight mb-1">Samen genieten</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Binnen 10 seconden een compleet nieuw voorleesverhaal. Klaar om te dromen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="px-6 py-12 @container">
        <div className="flex flex-col gap-4 mb-10">
          <h2 className="text-[#141118] dark:text-white text-3xl font-black leading-tight tracking-tight">
            Waarom ouders van ons houden
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium">De perfecte mix van verbinding en gemak voor het slapengaan.</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {/* Feature 1 */}
          <div className="group flex gap-4 rounded-3xl border-2 border-gray-50 dark:border-gray-800 bg-white dark:bg-background-dark/50 p-6 transition-all hover:border-primary/30 shadow-sm">
            <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 p-3 rounded-2xl h-fit">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[#141118] dark:text-white text-lg font-extrabold">Vergroot Zelfvertrouwen</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Door zichzelf als held te zien in positieve scenario&apos;s, groeit het zelfbeeld van je kind.</p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="group flex gap-4 rounded-3xl border-2 border-gray-50 dark:border-gray-800 bg-white dark:bg-background-dark/50 p-6 transition-all hover:border-primary/30 shadow-sm">
            <div className="bg-green-50 dark:bg-green-900/20 text-green-500 p-3 rounded-2xl h-fit">
              <span className="material-symbols-outlined">security</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[#141118] dark:text-white text-lg font-extrabold">100% Veilige Droomwereld</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Geen nare verrassingen. Onze verhalen zijn speciaal gefilterd op kindvriendelijke thema&apos;s.</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="group flex gap-4 rounded-3xl border-2 border-gray-50 dark:border-gray-800 bg-white dark:bg-background-dark/50 p-6 transition-all hover:border-primary/30 shadow-sm">
            <div className="bg-purple-50 dark:bg-purple-900/20 text-primary p-3 rounded-2xl h-fit">
              <span className="material-symbols-outlined">bedtime</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[#141118] dark:text-white text-lg font-extrabold">Echt even samen</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Geen schermtijd, maar &apos;samen-tijd&apos;. Even ontsnappen aan de dagelijkse drukte.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="p-6 mb-24">
        <div className="bg-primary rounded-[2rem] p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]"></div>
          <div className="relative z-10 flex flex-col gap-3">
            <h2 className="text-white text-2xl font-black">Klaar voor de eerste reis?</h2>
            <p className="text-purple-100 text-sm font-medium">Maak vanavond nog onvergetelijk voor je kind.</p>
          </div>
          <Link href="/wizard">
            <button className="relative z-10 bg-white text-primary px-8 h-14 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl">
              Start Nu Gratis
            </button>
          </Link>
        </div>
      </section>

      {/* Footer Links (Legal) */}
      <Footer />
    </main>
  )
}
