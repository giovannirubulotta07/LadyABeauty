# Lady A Beauty — sito di prenotazione

Sito di prenotazione online dello studio **Lady A Beauty** (Annemasse): extension de cils, rehaussement, browlift.
Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase · Vitest · Playwright.

> Il README completo (deploy su Vercel e Supabase, dominio, SPF/DKIM) arriverà nella fase 7.
> Analisi e decisioni: [`docs/sito-attuale.md`](docs/sito-attuale.md), [`docs/decisioni.md`](docs/decisioni.md), [`docs/proposta-tecnica.md`](docs/proposta-tecnica.md), [`docs/motore-slot.md`](docs/motore-slot.md).

## Avvio in locale

Prerequisiti: Node.js ≥ 22, Docker.

```bash
npm install
npx supabase start          # avvia Postgres, Auth e Storage in locale (Docker)
npx supabase db reset       # applica migrazioni + seed (prestazioni reali, clienti finte)
cp .env.example .env.local  # poi incolla URL e chiavi stampate da `supabase start`
                            # e genera APP_SECRET (comando nel file)
npm run dev                 # http://localhost:3000
```

Le email (codici di accesso) in locale non partono davvero: si leggono in **Mailpit** su http://127.0.0.1:54324.

Se il registro ECR di Supabase non è raggiungibile, usa Docker Hub:
`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io npx supabase start`.

## Script utili

| Comando | Cosa fa |
|---|---|
| `npm run test` | test unitari (Vitest): motore degli slot, fusi orari, contrasti WCAG dei token |
| `npm run test:db` | test d'integrazione sul database locale: concorrenza, vincoli, RLS, servizio disponibilità |
| `npm run test:e2e` | test end-to-end (Playwright, mobile + desktop) su `npm run build && npm run start`, con Supabase locale avviato: prenotazione completa con codice e-mail, conflitto di slot, annullamento, eliminazione account |
| `npm run typecheck` / `npm run lint` | controlli statici |
| `npm run db:types` | rigenera i tipi TypeScript dal database locale |
| `npm run images:gallery` | ritaglia le foto originali della galleria in `public/galerie` |
| `npx tsx scripts/generate-leopard.mts` | rigenera il pattern leopardato `public/patterns/leopard.svg` |

## Struttura

```
src/app/            route (sito pubblico in (site)/, poi admin/ e api/)
src/domain/         logica pura e testata (fusi orari, motore degli slot, orari, prezzi)
src/server/         codice solo server: env, client Supabase, query dei contenuti
src/components/     ui/ (primitivi) e site/ (header, footer, card…)
src/styles/         token di design (unica fonte per colori, font, raggi, spaziature)
supabase/           migrazioni SQL (schema + RLS) e seed
tests/e2e/          test Playwright
```

## Accesso delle clienti (Supabase Auth)

- Accesso **senza password**: codice a 6 cifre via email (valido 10 minuti), digitato nella stessa pagina. La stessa email contiene anche un link "Me connecter" (`/auth/confirmer`). Password facoltativa da Mon espace.
- Template email in francese: `supabase/templates/code-connexion.html` (usato in locale tramite `supabase/config.toml`).
- **In produzione** (dashboard Supabase → Authentication):
  - *URL Configuration*: Site URL = dominio del sito, Redirect URLs = `https://<dominio>/**`;
  - *Email Templates*: incollare il contenuto di `code-connexion.html` in "Magic Link" e "Confirm signup" (oggetto: « Votre code de connexion — Lady A Beauty »);
  - *Providers → Email*: lunghezza OTP 6, scadenza 600 secondi.
