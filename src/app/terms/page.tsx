import { SectionTitle, Card } from '@/components/ui'

export default function TermsPage() {
    return (
        <main className="px-4 py-6 space-y-6">
            <SectionTitle title="Algemene Voorwaarden" subtitle="De regels van het spel." />

            <Card className="space-y-4 text-sm leading-relaxed text-ink-800">
                <p>
                    Deze algemene voorwaarden zijn van toepassing op het gebruik van de app &quot;Bedtijdavonturen&quot;, aangeboden door
                    <strong>Korpershoek Management B.V.</strong>, KvK-nummer <strong>51502062</strong>.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">1. De Dienst</h3>
                <p>
                    Bedtijdavonturen is een app waarmee u gepersonaliseerde kinderverhalen kunt genereren met behulp van AI.
                    De output (verhalen en audio) krijgt u direct digitaal geleverd.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">2. Abonnementen en Betalingen</h3>
                <p>
                    Wij bieden zowel losse aankopen (bundels) als abonnementen aan.
                    Betalingen verlopen via Stripe. Abonnementen zijn maandelijks opzegbaar en lopen af aan het einde van de betaalde periode.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">3. Herroepingsrecht (Digitale Inhoud)</h3>
                <p>
                    Omdat onze verhalen direct digitaal worden gegenereerd en geleverd na aankoop, stemt u er bij de aankoop mee in dat
                    de levering direct begint. Hierdoor <strong>ziet u af van uw herroepingsrecht</strong> (bedenktijd van 14 dagen).
                    U kunt een aankoop die al geleverd is niet meer annuleren.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">4. Aansprakelijkheid</h3>
                <p>
                    Wij doen ons best om leuke en veilige verhalen te genereren, maar wij (en de AI) zijn niet perfect.
                    Korpershoek Management B.V. is niet aansprakelijk voor de inhoud van de gegenereerde verhalen of enige (inschattings)fouten van de AI.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">5. Wijzigingen</h3>
                <p>
                    Wij kunnen deze voorwaarden en de prijzen wijzigen. Bij prijswijzigingen van een lopend abonnement informeren wij u vooraf,
                    zodat u het abonnement kunt opzeggen als u dat wenst.
                </p>
            </Card>
        </main>
    )
}
