# Bedtijdavonturen – Autonome set-up

## Deploy
1. Upload alle bestanden naar je Netlify-site of je GitHub (Netlify koppelt automatisch).
2. Zet **Environment Variables** (Site → Settings → Environment):
   - `ML_API_KEY` (MailerLite API v2)
   - `ML_PREMIUM_GROUP_ID` (ID van groep “Premium”)
   - `ML_FROM_EMAIL` (afzender)
   - `SITE_BASE` = https://bedtijdavonturen.nl
   - (Optioneel) `OPENAI_API_KEY` (rijkere verhalen)
   - (Optioneel) `STRIPE_WEBHOOK_SECRET` (als je webhooks verifieert)
3. Zet je **Stripe Payment Link** op de knop “Start proef (Stripe)”.

## Functions
- `/.netlify/functions/generate-story` – genereert verhaal (met OpenAI als key aanwezig; anders fallback).
- `/.netlify/functions/weekly-digest` – **Scheduled**: maakt en verzendt wekelijkse campagne naar Premium.
- `/.netlify/functions/stripe-webhook` – voegt betalers automatisch toe aan Premium.

## Pages
- `/` – landingspagina, MailerLite embed “ml('account','1722170')” en `data-form="m1IM6t"` (pas aan indien anders).
- `/story.html?name=Tim&interests=dieren,ruimte` – toont direct een verhaal.

## SEO
- GA4 placeholder in `<head>` (vervang `G-XXXX`), `robots.txt`, `sitemap.xml`.

*(Build 20250810_113400)*
