# Motore di disponibilità (fase 2)

## Dove sta il codice

| File | Ruolo |
|---|---|
| `src/domain/time/paris.ts` | Conversioni Europe/Paris ⇄ UTC, giorni, giorni della settimana. Unico punto in cui si toccano i fusi orari. |
| `src/domain/availability/engine.ts` | Il motore: funzione **pura** (riceve anche "adesso" come parametro). |
| `src/server/availability/service.ts` | Carica dal database impostazioni, orari, override, appuntamenti, blocchi e hold, poi chiama il motore. Mai in cache. |
| `supabase/migrations/20261118090000_booking_guards.sql` | `create_appointment` e `create_block`: le sole porte di scrittura sul calendario. |

## L'algoritmo

Per un giorno e una durata:

1. **Candidati** = partenze di riferimento (10:00, 12:00, 14:30, 16:00, 18:00) e, per ogni occupazione del giorno (appuntamento, blocco, hold della lista d'attesa):
   - (a) l'ora in cui finisce;
   - (b) l'ora di inizio meno la durata richiesta.
2. Un candidato è **valido** se:
   - la prestazione sta per intero in una finestra di apertura (niente pausa né chiusura);
   - non tocca nessuna occupazione (intervalli semiaperti: 11:45 dopo un appuntamento che finisce alle 11:45 va bene);
   - rispetta il preavviso minimo e l'orizzonte (oggi + 60 giorni, in ora di Parigi).
3. Dalle 18:00 in poi lo stato è **"sur demande"**, salvo sblocco del giorno da parte dell'admin.
4. Ordinati, senza duplicati.

**Stato del giorno** (per la striscia dei giorni): `past`, `beyond_horizon`, `closed` (chiuso o in ferie), `full`, `on_request_only`, `available`.

## Garanzia anti-doppia prenotazione

1. **Vincolo `EXCLUDE USING gist`** sugli appuntamenti non annullati: due sovrapposizioni sono impossibili, anche con un `INSERT` diretto.
2. **`create_appointment` / `create_block`** prendono un lock per ogni giorno toccato e ricontrollano blocchi e hold sotto lock. Errori restituiti: `SLOT_TAKEN`, `SLOT_BLOCKED`, `SLOT_HELD`. Solo il server (service role) può chiamarle.
3. **Ricontrollo lato server** con lo stesso motore (`isSlotBookable`) prima di scrivere: lo userà il flusso di prenotazione nella fase 3.

## Test

`npm run test` (unitari, girano con il fuso **UTC+14** per scovare qualsiasi dipendenza dal fuso della macchina) e `npm run test:db` (integrazione, serve `npx supabase start`).

### Esempi del brief (durate reali: Extension 1 h 45, Rehaussement 1 h)
| Esempio | Risultato verificato |
|---|---|
| Feriale vuoto, Extension | 10:00 · 12:00 · 14:30 · 16:00 · 18:00 *sur demande* |
| Extension 10:00–11:45, prestazione da 1 h | 11:45 · 12:00 · 14:30 · 16:00 · 18:00* |
| … dopo aver prenotato 11:45–12:45 | 12:45 proposto, 12:00 no; 11:45–12:45 + 12:45–13:45 riempiono la mattina |
| Extension 10:00, nuova Extension | 12:00 (12:00–13:45) proposto; nessuno slot attraversa 14:00–14:30 |
| Prestazione che sfora pausa o chiusura | Mai proposta (2 h 30 → solo 10:00, 14:30, 16:00) |
| Sabato | Niente oltre le 14:30 |
| 18:00 sbloccato | 18:00 prenotabile |
| Ora legale (28/03 ↔ 30/03, 24/10 ↔ 26/10) | Stessi orari locali, istanti UTC corretti, appuntamenti salvati in UTC letti all'ora giusta |

### Altri casi coperti
- **Preavviso:** il giorno stesso, al limite esatto, configurabile.
- **Calendario:**
  - "oggi" calcolato in ora di Parigi;
  - orizzonte J+60 incluso, J+61 escluso;
  - giorni passati;
  - domenica.
- **Interventi dell'admin:**
  - giorno chiuso o orari speciali;
  - ferie di un giorno o di più giorni;
  - fasce bloccate, con l'incastro calcolato attorno al blocco;
  - hold della lista d'attesa, visibile solo a chi lo detiene;
  - lock serale disattivabile o che si applica anche agli incastri dopo le 18:00;
  - partenze di riferimento configurabili.
- **Stato del giorno:** pieno, "solo su richiesta".
- **Controllo finale:** solo slot proposti e disponibili; uno "sur demande" è ammesso solo per l'admin.
- **Test a proprietà:** 3 000 giornate casuali su entrambi i cambi d'ora, con più di 3 000 slot controllati. Nessuno slot sfora gli orari, si sovrappone, viola il preavviso o cambia giorno.

### Database
- Due clienti confermano lo stesso slot nello stesso istante: una riceve `SLOT_TAKEN`.
- 20 prenotazioni parallele sovrapposte: ne passa esattamente una.
- Gara tra un blocco in corso e una prenotazione: mai entrambi. Questo test fallisce se si toglie il lock, quindi il lock serve davvero.
- Slot adiacenti accettati, annullamento che libera lo slot, `INSERT` diretto bloccato dal vincolo.
- Blocchi, ferie su più giorni, hold attivi, scaduti o propri.
- **Permessi:** anonimi e clienti non possono chiamare le funzioni. Una cliente vede solo i propri appuntamenti, l'admin tutti.
- **Servizio:** carica gli orari reali del seed, ignora gli annullati, gestisce sblocco serale e hold, e calcola lo stato della settimana.

### Test a mutazione
Ho rotto il motore di proposito in 6 punti (controllo finestre, controllo sovrapposizioni, regola (a), regola (b), `>` al posto di `≥` sulle 18:00, preavviso con estremo sbagliato) e il lock SQL. **Ogni mutazione viene intercettata da almeno un test.** La regola (b) inizialmente non era coperta da nessun test: ho aggiunto due test specifici.
