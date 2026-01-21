import { SectionTitle, Card } from '@/components/ui'

export default function PrivacyPage() {
    return (
        <main className="px-4 py-6 space-y-6">
            <SectionTitle title="Privacybeleid" subtitle="Hoe wij omgaan met uw gegevens." />

            <Card className="space-y-4 text-sm leading-relaxed text-ink-800">
                <p>
                    Dit privcaybeleid is van toepassing op de diensten van <strong>Korpershoek Management B.V.</strong> (hierna: &quot;wij&quot;),
                    gevestigd te Esselaar 17, 1359 Almere, ingeschreven bij de Kamer van Koophandel onder nummer <strong>51502062</strong>.
                </p>

                <h3 className="font-bold text-ink-950 pt-2">1. Welke gegevens verzamelen wij?</h3>
                <p>
                    Om onze app &quot;Bedtijdavonturen&quot; te laten werken, verwerken wij de volgende persoonsgegevens:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Accountgegevens:</strong> Uw e-mailadres, naam en profielfoto (via Google of e-mailregistratie).</li>
                    <li><strong>Profielgegevens:</strong> Namen en leeftijdsgroepen van uw kinderen (om verhalen op maat te maken).</li>
                    <li><strong>Gegenereerde content:</strong> De verhalen en audio die u via de app aanmaakt.</li>
                    <li><strong>Technische gegevens:</strong> IP-adres en apparaat-informatie (voor beveiliging via Firebase).</li>
                </ul>

                <h3 className="font-bold text-ink-950 pt-2">2. Waarom verwerken wij deze gegevens?</h3>
                <p>Wij gebruiken uw gegevens uitsluitend om:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>U toegang te geven tot uw account en opgeslagen verhalen.</li>
                    <li>Gepersonaliseerde verhalen te genereren via OpenAI (uw data wordt <strong>niet</strong> gebruikt om AI-modellen te trainen).</li>
                    <li>Betalingen te verwerken (via Stripe).</li>
                </ul>

                <h3 className="font-bold text-ink-950 pt-2">3. Delen met derden</h3>
                <p>
                    Wij verkopen uw gegevens nooit door. Wij delen gegevens alleen met noodzakelijke dienstverleners:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Firebase (Google):</strong> Voor hosting, database en authenticatie.</li>
                    <li><strong>OpenAI:</strong> Voor het genereren van tekst en audio.</li>
                    <li><strong>Stripe:</strong> Voor het veilig afhandelen van betalingen.</li>
                </ul>

                <h3 className="font-bold text-ink-950 pt-2">4. Uw rechten (AVG)</h3>
                <p>
                    U heeft het recht om uw gegevens in te zien, te corrigeren of te verwijderen.
                    U kunt uw account verwijderen via de app. Heeft u vragen? Neem contact op via de gegevens op onze website.
                </p>
            </Card>
        </main>
    )
}
