# Lista d'attesa (fase 5)

## Per la cliente
1. Nel flusso di prenotazione, scelto un giorno:
   - giorno pieno → pulsante « Être prévenue si une place se libère »;
   - orari disponibili ma nessuno le va bene → link discreto con la stessa funzione.
2. Inserisce le coordinate (o è già collegata), conferma l'email con il codice ed è iscritta per **quel giorno e quella prestazione**. Il massimo è 5 iscrizioni attive.
3. Quando si libera un posto adatto, riceve l'email « Une place s'est libérée ». Il link apre una pagina dove **prenota con un tocco, senza login** (il link segreto la identifica) oppure lascia il posto.
4. In « Mon espace » vede le sue iscrizioni (in attesa / posto proposto) e può ritirarsi.

## Regola di equità (opzione b)
`src/domain/waitlist/planner.ts`, funzione pura testata:
- si servono le iscritte **in ordine di iscrizione**;
- ognuna riceve il primo orario libero che entra nella sua prestazione, con **30 minuti di esclusiva**: lo slot è nascosto a tutte le altre. Se una cancellazione libera 2 h, due prestazioni da 1 h servono due iscritte;
- se lo slot è a **meno di 12 h**, si avvisano tutte insieme: vince la prima che conferma;
- **dalle 21:00 alle 8:00 nessuna email**, salvo slot imminenti;
- gli orari già liberi al momento dell'iscrizione (scartati da lei) e le offerte lasciate scadere o rifiutate **non le vengono più proposti**;
- gli slot serali « sur demande » non vengono mai proposti finché Alessia non li sblocca.

Tutti i parametri si trovano in `business_settings` (`waitlist_exclusive_minutes`, `waitlist_broadcast_before_hours`, `waitlist_quiet_start/end`).

## Quando si attiva
- Subito dopo un annullamento: da Mon espace, dal link nell'email o per eliminazione dell'account. Nella fase 6 anche dopo annullamenti o spostamenti dell'admin, lo sblocco delle 18:00 e la rimozione di un blocco.
- Subito dopo una rinuncia o un'uscita dalla lista.
- Ogni 5 minuti (`/api/cron/taches`), che:
  - fa scadere le esclusive non usate e passa alla successiva;
  - chiude le iscrizioni dei giorni passati;
  - invia le offerte rimandate dalla notte.

## Garanzie
Funzioni SQL sotto il lock per giorno (`create_waitlist_offer`, `redeem_waitlist_offer`, `release_waitlist_offer`, `expire_waitlist`):
- mai lo stesso slot offerto in esclusiva a due persone, nemmeno con due processi in parallelo;
- una sola offerta aperta per iscrizione;
- al riscatto la disponibilità reale viene ricontrollata (motore + lock). Se qualcuno è stato più veloce: messaggio gentile, e lei resta in lista;
- l'esclusiva tiene lo slot (`slot_holds`) e nessuna prenotazione normale può prenderlo nel frattempo;
- il token del link non è salvato in chiaro: il database ne conserva solo l'hash SHA-256.

## Test
- 10 unitari sul pianificatore;
- 7 sulle funzioni SQL (inclusa la concorrenza);
- 4 d'integrazione sul servizio (annullamento → offerta → scadenza → successiva, incastro su 2 h, slot imminente, orari scartati);
- E2E: Alice prenota, Béa si iscrive, Alice annulla, Béa riceve l'email e prenota dal link.
