# Proposta tecnica — prima di scrivere codice

Stato: **in attesa di approvazione.** Le scelte marcate *(da confermare)* dipendono dalle risposte alle domande in fondo a `docs/sito-attuale.md` §10–11.

---

## 1. Stack e piccoli aggiustamenti

Lo stack del brief resta invariato. Tre precisazioni:

| Tema | Proposta | Perché |
|---|---|---|
| **Job pianificati** | **Supabase `pg_cron` + `pg_net`** che chiamano le route `/api/cron/*` ogni 5 minuti (protette da segreto) | Sul piano Vercel Hobby i cron girano al massimo **una volta al giorno**: non basta per le scadenze della lista d'attesa (finestre di 30 min). `pg_cron` è gratuito e indipendente dal piano Vercel. |
| **Date e fusi orari** | `date-fns` v4 + `@date-fns/tz` (`TZDate`) | Leggero, ben tipizzato, gestisce Europe/Paris e l'ora legale. Tutta la conversione è in un solo modulo `domain/time`. |
| **Login cliente** | Supabase Auth con **codice OTP a 6 cifre via email** (la stessa email contiene anche il magic link) + password facoltativa | Le clienti arrivano da Instagram: il browser interno di Instagram apre i magic link in **un altro browser** e la prenotazione in corso si perde. Con il codice da digitare la cliente resta nella stessa pagina. È la scelta di Planity. |
| **Pagamento acconto** *(da confermare, D8)* | Stripe Checkout (pagina ospitata) + webhook | Solo se Alessia vuole mantenere l'acconto online. È un'aggiunta allo stack. |

---

## 2. Schema del database

Convenzioni: `uuid` come chiavi, `timestamptz` in UTC, intervalli `tstzrange` semiaperti `[inizio, fine)` (così un appuntamento che finisce alle 11:50 non "tocca" uno che inizia alle 11:50). Importi in centesimi (`integer`). Estensione `btree_gist`.

### Tipi enumerati
```sql
create type appointment_status as enum ('pending_payment','confirmed','cancelled','completed','no_show');
create type appointment_source as enum ('online','admin','waitlist');
create type waitlist_status    as enum ('waiting','notified','booked','expired','cancelled');
create type offer_status       as enum ('offered','accepted','expired','superseded');
create type notification_status as enum ('queued','sent','failed','skipped');
```
(`pending_payment` serve solo se si tiene l'acconto Stripe.)

### Catalogo
```sql
service_categories (id, name, sort_order, is_active)

services (
  id, category_id → service_categories,
  slug unique, name, description,          -- testo semplice/markdown leggero
  duration_min int check (duration_min between 5 and 480),
  price_cents int null,                    -- null = "sur devis"
  price_is_from bool default false,        -- "à partir de"
  deposit_cents int null,                  -- acconto (D8)
  bookable_online bool default true,
  is_active bool, sort_order int, created_at, updated_at)

service_variants (
  id, service_id → services on delete cascade,
  name, description,
  duration_min int null,                   -- null = eredita dal servizio
  price_cents int null,                    -- null = eredita
  is_active, sort_order)
```

### Impostazioni e calendario
```sql
business_settings (                         -- riga unica (id = true)
  name, legal_name, siret, phone, email, instagram_url,
  address_line1, address_line2, postal_code, city, country, lat, lng,
  timezone text default 'Europe/Paris',
  min_notice_minutes int default 120,
  max_advance_days   int default 60,        -- sito attuale: 56 (D12)
  cancellation_cutoff_hours int default 24,
  reference_starts time[] default '{10:00,12:00,14:30,16:00,18:00}',
  evening_lock_from time default '18:00',
  waitlist_exclusive_minutes int default 30,
  waitlist_broadcast_before_hours int default 12,
  reminder_send_time time default '09:00',
  logo_path text, home_content jsonb, updated_at)

opening_hours (id, weekday smallint 1..7, opens time, closes time,
               check (opens < closes))     -- più righe per giorno = pausa implicita

day_overrides (day date primary key,
               evening_unlocked bool default false,
               closed bool default false,
               custom_hours jsonb null,     -- es. orari ridotti un giorno
               note text)

blocks (id, period tstzrange not null, reason text, created_by, created_at)
```

### Clienti
```sql
profiles (id = auth.users.id,
          full_name, phone, email,
          marketing_email bool default false,
          privacy_accepted_at timestamptz not null,
          deleted_at timestamptz null, created_at, updated_at)

client_notes (id, client_id → profiles, body, created_by, created_at)   -- solo admin
```
Il ruolo admin **non** è una colonna modificabile: sta in `auth.users.app_metadata.role = 'admin'`, che si imposta solo con la service role. Funzione `is_admin()` = `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`.

### Appuntamenti
```sql
appointments (
  id, client_id → profiles,
  period tstzrange not null,
  status appointment_status not null default 'confirmed',
  source appointment_source not null,
  total_price_cents int, deposit_cents int,
  client_note text, admin_note text,
  payment_expires_at timestamptz null,     -- solo pending_payment
  cancelled_at, cancelled_by uuid, cancellation_reason text,
  created_at, updated_at,
  constraint no_overlap exclude using gist (period with &&)
    where (status in ('pending_payment','confirmed'))
)

appointment_items (                         -- 1..N prestazioni (D10)
  id, appointment_id → appointments on delete cascade,
  service_id, variant_id null,
  service_name, variant_name,              -- snapshot: lo storico resta corretto
  duration_min, price_cents, position)
```

### Lista d'attesa
```sql
waitlist_entries (
  id, client_id, service_id, variant_id null,
  day date not null, duration_min int,     -- snapshot
  status waitlist_status default 'waiting',
  created_at, updated_at,
  unique (client_id, service_id, variant_id, day) where status in ('waiting','notified'))

waitlist_offers (
  id, entry_id → waitlist_entries,
  period tstzrange,                        -- slot proposto
  token_hash text unique,                  -- link monouso
  exclusive_until timestamptz null,        -- null = offerta "a tutte"
  status offer_status, sent_at, created_at)

slot_holds (id, period tstzrange, offer_id → waitlist_offers,
            expires_at timestamptz, released_at timestamptz null)
```

### Sistema
```sql
notification_log (id, kind text, channel text,           -- 'email' | 'sms' (futuro)
                  recipient text, appointment_id null, offer_id null,
                  idempotency_key text unique,           -- es. 'reminder:<id>:<inizio>'
                  status notification_status, provider_message_id, error,
                  created_at, sent_at)

gallery_images (id, storage_path, alt, width, height, sort_order, is_published)

rate_limits (key text, window_start timestamptz, hits int, primary key (key, window_start))
```

### Indici principali
- `appointments using gist (period)` (creato dal vincolo) + `(client_id, lower(period))`;
- `appointments (lower(period)) where status = 'confirmed' and reminder…` per il job promemoria;
- `blocks using gist (period)`, `slot_holds using gist (period) where released_at is null`;
- `waitlist_entries (day, status, created_at)`;
- `notification_log (appointment_id)`, `(created_at desc)`.

### Garanzia anti-doppia-prenotazione (tre livelli)
1. **Vincolo `EXCLUDE USING gist`** su `appointments`: due appuntamenti attivi sovrapposti sono fisicamente impossibili, anche con due conferme nello stesso millisecondo. In caso di violazione (`23P01`) la cliente vede "Ce créneau vient d'être réservé" e gli orari aggiornati.
2. **Tutte le scritture sul calendario** (prenotare, spostare, bloccare, creare un hold) passano da funzioni SQL `security definer` che prendono un `pg_advisory_xact_lock` sul **giorno locale** e ricontrollano blocchi, hold e appuntamenti nella stessa transazione. Così anche blocchi e hold (che stanno in altre tabelle) non possono sovrapporsi a un appuntamento.
3. **Ricalcolo lato server** della disponibilità al momento della conferma con lo stesso algoritmo usato per mostrare gli slot.

### Row Level Security (attiva su tutte le tabelle)
| Tabella | Cliente (`authenticated`) | Pubblico (`anon`) | Admin |
|---|---|---|---|
| services, variants, categories, opening_hours, gallery_images | lettura righe attive | lettura righe attive | tutto |
| business_settings | lettura (vista pubblica senza campi interni) | idem | tutto |
| profiles | select/update **solo la propria** riga | — | tutto |
| appointments, appointment_items | select **solo i propri**; nessun insert/update diretto (solo via RPC) | — | tutto |
| waitlist_entries | select/insert/annulla **i propri** | — | tutto |
| day_overrides, blocks, slot_holds, waitlist_offers, client_notes, notification_log, rate_limits | — | — | tutto (offers/holds anche via service role) |

La disponibilità non si legge mai dalle tabelle lato client: la calcola il server (service role) e restituisce solo `{inizio, fine, stato}`.

---

## 3. Struttura delle cartelle

```
.
├─ src/
│  ├─ app/
│  │  ├─ (site)/                      # sito pubblico
│  │  │  ├─ page.tsx                  # Home
│  │  │  ├─ prestations/
│  │  │  ├─ reserver/                 # flusso di prenotazione (step nello stesso URL)
│  │  │  ├─ galerie/
│  │  │  ├─ mon-espace/               # rendez-vous, liste d'attente, profil, RGPD
│  │  │  ├─ liste-attente/[token]/    # link dall'email dell'offerta
│  │  │  ├─ rdv/[token]/              # gestione/annullamento da link email
│  │  │  ├─ mentions-legales/  confidentialite/  cookies/
│  │  ├─ admin/                       # agenda, rdv, clientes, liste, réglages, emails
│  │  ├─ api/
│  │  │  ├─ cron/reminders/  cron/waitlist/  cron/cleanup/
│  │  │  ├─ ics/[token]/
│  │  │  └─ stripe/webhook/           # solo se acconto
│  │  ├─ auth/callback/
│  │  ├─ sitemap.ts  robots.ts  opengraph-image.tsx
│  ├─ domain/                         # TypeScript puro, zero dipendenze da Next/Supabase
│  │  ├─ time/                        # conversioni Europe/Paris ⇄ UTC
│  │  ├─ availability/                # algoritmo slot + test
│  │  ├─ booking/                     # regole di annullamento, preavviso, prezzi
│  │  └─ waitlist/                    # chi avvisare, scadenze + test
│  ├─ server/                         # solo server ('server-only')
│  │  ├─ db/                          # client Supabase, repository, tipi generati
│  │  ├─ actions/                     # Server Actions validate con Zod
│  │  ├─ notifications/               # interfaccia Notifier + canale Email (Resend), SMS (stub)
│  │  ├─ security/                    # token firmati, rate limit, honeypot
│  │  └─ ics.ts
│  ├─ emails/                         # template React Email
│  ├─ components/
│  │  ├─ ui/                          # bottoni, input, card, dialog...
│  │  ├─ booking/  admin/  site/
│  ├─ styles/                         # tokens.css (colori, font, raggi, spazi) + globals.css
│  └─ lib/                            # utility condivise, formattazione FR
├─ public/                            # pattern leopardato SVG, favicon
├─ supabase/
│  ├─ migrations/                     # schema, RLS, funzioni, cron
│  └─ seed.sql                        # prestazioni reali + dati di prova finti
├─ tests/
│  ├─ e2e/                            # Playwright
│  └─ db/                             # test SQL dei vincoli (concorrenza)
└─ docs/
```

---

## 4. Algoritmo degli slot (pseudocodice)

```text
funzione slotsDelGiorno(giorno, durata, ora_attuale, contesto):
  # contesto = impostazioni, orari settimanali, override del giorno,
  #            occupazioni del giorno (appuntamenti attivi + blocchi + hold non scaduti,
  #            escluso l'eventuale hold che appartiene a chi sta prenotando)

  se giorno chiuso (domenica, override.closed, ferie che coprono tutte le finestre): ritorna []
  se giorno < oggi o giorno > oggi + max_advance_days: ritorna []

  finestre ← finestreDiApertura(giorno)          # es. [10:00–14:00], [14:30–19:45]
                                                   # ora locale → istante UTC (gestisce DST)
  candidati ← insieme vuoto
  per ogni t in reference_starts:  candidati.aggiungi(istante(giorno, t))
  per ogni occ in occupazioni:
      candidati.aggiungi(occ.fine)                 # (a) subito dopo
      candidati.aggiungi(occ.inizio − durata)      # (b) finisce esattamente all'inizio

  risultato ← []
  per ogni c in ordina(candidati):                 # l'insieme elimina i duplicati
      fine ← c + durata
      se nessuna finestra contiene interamente [c, fine): continua      # pausa / chiusura
      se esiste occ in occupazioni che interseca [c, fine): continua    # intervalli [ )
      se c < ora_attuale + min_notice: continua
      stato ← DISPONIBILE
      se oraLocale(c) ≥ evening_lock_from e non override.evening_unlocked:
          stato ← SUR_DEMANDE                      # visibile ma non selezionabile
      risultato.aggiungi({inizio: c, fine, stato})
  ritorna risultato
```

**Stato del giorno nella striscia:** `fermé` (nessuna finestra), `complet` (nessuno slot), `sur demande uniquement` (solo slot serali bloccati), `disponible`.

**Note di progetto**
- Funzione **pura**: riceve tutto in input, compreso `ora_attuale`. I test sono deterministici e possono simulare qualunque data, inclusi i cambi d'ora.
- Aggiungo come candidati anche i bordi dei **blocchi** e degli **hold** (sono occupazioni come le altre): fa lo stesso "incastro" attorno a una fascia bloccata.
- La durata è la somma delle prestazioni scelte (se si mantiene la prenotazione multipla).
- Il server ricalcola tutto alla conferma; la funzione SQL di prenotazione verifica sotto lock.

**Test obbligatori** (con le durate reali: Extension 1h50, Rehaussement 45 min, ecc.):
1. Giorno feriale vuoto, Extension 1h50 → 10:00, 12:00, 14:30, 16:00; 18:00 `sur demande` (solo se la chiusura lo permette, vedi D1/D2).
2. Extension 10:00–11:50, Rehaussement 45 min → 11:50, 12:00, …; dopo aver prenotato 11:50–12:35 viene proposto 12:35, e due prestazioni da 45 min entrano tra 11:50 e 14:00.
3. Extension 10:00–11:50, nuova Extension → 12:00 (12:00–13:50); nessuno slot attraversa 14:00–14:30.
4. Nessuna prestazione che sfora la pausa o la chiusura.
5. Sabato: niente oltre la chiusura.
6. Giorno con 18:00 sbloccato → 18:00 prenotabile.
7. Ora legale: sabato 28/03/2026 (UTC+1) e lunedì 30/03/2026 (UTC+2), idem fine ottobre: stessi orari locali, istanti UTC corretti; appuntamenti salvati in UTC letti correttamente.
8. Preavviso minimo e finestra massima; slot non duplicati; ordinamento.
9. Test SQL di concorrenza: due transazioni parallele sullo stesso slot → una sola riesce.

---

## 5. Lista d'attesa: la mia scelta

**Raccomando l'opzione (b), esclusiva temporanea, con due correttivi.**

**Perché non (a), tutte insieme:** con (a) vince chi legge l'email per prima, non chi si è iscritta per prima, e questo contraddice la regola "in ordine di iscrizione". In più, con uno studio da una sola persona e pochi slot liberati, avvisare 6 clienti per un posto ne delude 5 ogni volta, e una cliente che clicca e trova "déjà pris" smette di fidarsi della lista.

**Come funziona (b):**
1. Si libera uno slot → il sistema cerca, in ordine di iscrizione, la prima iscritta a quel giorno la cui prestazione **entra** nello spazio liberato (con lo stesso algoritmo degli slot).
2. Le invia un'email con un link monouso e **blocca lo slot per lei** (`slot_holds`) per **30 minuti** (configurabile). Durante l'esclusiva lo slot non appare alle altre.
3. Se conferma → prenotazione (con ricontrollo reale), iscrizione `réservée`. Se non conferma entro la scadenza → hold rilasciato, si passa alla successiva.

**Correttivi:**
- **Slot imminente:** se mancano meno di **12 h** (configurabile) all'inizio dello slot, o se le iscritte idonee sono finite, si passa all'avviso **a tutte le restanti insieme** (opzione a), perché le esclusive in sequenza lascerebbero lo slot vuoto.
- **Notte:** nessuna email tra 21:00 e 08:00; un'esclusiva che inizierebbe di notte parte alle 08:00 (salvo slot imminente).

Il job `pg_cron` ogni 5 minuti fa scadere le offerte e passa alla successiva. Le iscrizioni scadono automaticamente quando il giorno è passato.
