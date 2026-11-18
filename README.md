# Lady A Beauty — sito di prenotazione

Sito di prenotazione online dello studio **Lady A Beauty** (Annemasse): extension de cils, rehaussement, browlift.
Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase · Vitest · Playwright.

> Il README completo (deploy su Vercel e Supabase, dominio, SPF/DKIM) arriverà nella fase 7.
> Analisi e decisioni: [`docs/sito-attuale.md`](docs/sito-attuale.md), [`docs/decisioni.md`](docs/decisioni.md), [`docs/proposta-tecnica.md`](docs/proposta-tecnica.md).

## Avvio in locale

Prerequisiti: Node.js ≥ 22, Docker.

```bash
npm install
npx supabase start          # avvia Postgres, Auth e Storage in locale (Docker)
npx supabase db reset       # applica migrazioni + seed (prestazioni reali, clienti finte)
cp .env.example .env.local  # poi incolla URL e chiavi stampate da `supabase start`
npm run dev                 # http://localhost:3000
```

Se il registro ECR di Supabase non è raggiungibile, usa Docker Hub:
`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io npx supabase start`.

## Script utili

| Comando | Cosa fa |
|---|---|
| `npm run test` | test unitari (Vitest): logica di dominio, contrasti WCAG dei token |
| `npm run test:e2e` | test end-to-end (Playwright, mobile + desktop) su `npm run start` |
| `npm run typecheck` / `npm run lint` | controlli statici |
| `npm run db:types` | rigenera i tipi TypeScript dal database locale |
| `npm run images:gallery` | ritaglia le foto originali della galleria in `public/galerie` |
| `npx tsx scripts/generate-leopard.mts` | rigenera il pattern leopardato `public/patterns/leopard.svg` |

## Struttura

```
src/app/            route (sito pubblico in (site)/, poi admin/ e api/)
src/domain/         logica pura e testata (orari, prezzi; slot e lista d'attesa nelle fasi 2 e 5)
src/server/         codice solo server: env, client Supabase, query dei contenuti
src/components/     ui/ (primitivi) e site/ (header, footer, card…)
src/styles/         token di design (unica fonte per colori, font, raggi, spaziature)
supabase/           migrazioni SQL (schema + RLS) e seed
tests/e2e/          test Playwright
```
