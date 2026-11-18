# Area admin (fase 6)

L'area admin è all'indirizzo `/admin`. È interamente in francese, pensata per il telefono (barra di navigazione in basso) e con una colonna laterale su computer.
Le schermate sono in `docs/screenshots/fase-6/`.

## Accesso e sicurezza

- **Account admin:** il ruolo `admin` è in `app_metadata`, che solo la chiave di servizio può scrivere. Un utente non può quindi darsi il ruolo da solo.
  - Per crearlo: `npm run admin:create -- email@esempio.fr [password]`.
  - Senza password, Alessia accede con il codice a 6 cifre ricevuto via e-mail, come le clienti.
- **Controllo su più livelli:**
  1. `proxy.ts` rinnova la sessione su `/admin/*`.
  2. Ogni pagina passa da `<AdminGate>`: senza sessione mostra il login, con un account non admin mostra « Accès réservé ». Il contenuto della pagina non viene nemmeno calcolato.
  3. Ogni query admin (`src/server/admin/*.ts`) chiama `requireAdmin()`.
  4. Ogni Server Action passa da `adminAction()`, che fa tre cose:
     - verifica la sessione;
     - valida l'input con Zod;
     - traduce in francese gli errori SQL (`SLOT_TAKEN`, `SLOT_BLOCKED`…).

  Il controllo nel layout da solo non basterebbe: Next.js non ri-esegue i layout durante la navigazione lato client.

- **Scritture sul calendario:** passano dalle stesse funzioni SQL della prenotazione online (lock per giorno, blocchi, hold della lista d'attente, vincolo EXCLUDE). In più c'è la nuova `move_appointment`, che blocca sia i giorni di partenza sia quelli di arrivo in ordine crescente, per evitare deadlock.
- **Test:**
  - `tests/db/admin.test.ts` copre lo spostamento: conflitti, blocchi, due spostamenti simultanei, permessi SQL. Copre anche gli orari, che vengono sostituiti in blocco o per niente.
  - `tests/db/admin-actions.test.ts` verifica che senza sessione admin le azioni vengano rifiutate senza scrivere nulla.
  - `tests/e2e/admin.spec.ts` copre il percorso completo.

## Funzioni

| Sezione                 | Cosa fa                                                                                                                                                                                                                                                          | Note                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Agenda — giorno**     | Planning cronologico: appuntamenti con telefono cliccabile, buchi liberi con « + Ajouter », blocchi, slot tenuti per la lista d'attesa, annullati in fondo                                                                                                       | I buchi liberi sono calcolati sugli orari di apertura reali del giorno              |
| **Agenda — settimana**  | 7 giorni: in colonna su telefono, a griglia su computer; numero di persone in attesa per giorno                                                                                                                                                                  |                                                                                     |
| **Sblocco delle 18:00** | Interruttore per giorno: rende prenotabili online gli orari « sur demande »                                                                                                                                                                                      | Allo sblocco la lista d'attesa di quel giorno viene ricontrollata subito            |
| **Blocchi**             | Ferie (giorni interi, anche più giorni) oppure fascia oraria, con motivo                                                                                                                                                                                         | Rifiutati se coprono un appuntamento esistente: va prima spostato o annullato       |
| **Nuovo appuntamento**  | Cliente esistente (ricerca per nome, e-mail o telefono) o nuova cliente; prestazione e variante; durata modificabile; orari liberi proposti a pulsanti, oppure ora libera; e-mail di conferma opzionale                                                          | Vedi « Regole per Alessia » qui sotto                                               |
| **Scheda appuntamento** | Dettagli, sposta (nuova data, ora, durata; e-mail « Rendez-vous déplacé »), annulla (messaggio alla cliente; e-mail), segna « Terminé » o « Absente », e-mail inviate                                                                                            | Annullamento e spostamento ripropongono subito lo slot liberato alla lista d'attesa |
| **Clientes**            | Ricerca e creazione; scheda con note private, coordinate, appuntamenti futuri, storico, numero di visite e di assenze                                                                                                                                            | L'e-mail di una cliente con account non è modificabile dall'admin: è il suo login   |
| **Attente**             | Chi aspetta, giorno per giorno, nell'ordine di iscrizione; rimozione; « Proposer les créneaux libres maintenant »                                                                                                                                                |                                                                                     |
| **E-mails**             | Registro degli ultimi 150 invii, con filtro « Échecs »                                                                                                                                                                                                           | Etichette in francese per ogni tipo di e-mail                                       |
| **Réglages**            | Orari settimanali (più fasce al giorno); regole (preavviso, orizzonte, annullamento, orari di partenza di riferimento, soglia « sur demande », ora del promemoria, lista d'attesa); studio e notifiche; logo; testi della home; prestazioni e varianti; galleria | Ogni salvataggio aggiorna subito il sito pubblico (`updateTag`)                     |

### Regole per Alessia quando prenota lei (come Planity e Fresha)

- **Non valgono per lei:**
  - il preavviso minimo;
  - l'orizzonte di prenotazione;
  - la soglia delle 18:00.
- **Restano valide:**
  - gli orari di apertura (gli orari proposti sono dentro l'apertura);
  - i blocchi;
  - gli slot tenuti per la lista d'attesa;
  - il divieto di sovrapposizioni.
- **Ora libera:** può inserire qualunque ora a mano, anche fuori dagli orari proposti. In quel caso un avviso lo segnala e il sistema la accetta solo se non si sovrappone a nulla.
- **Prestazioni:** può prenotare anche quelle segnate « au studio uniquement », cioè non prenotabili online.
- **Notifiche:** per le prenotazioni fatte da lei non riceve l'e-mail « nouveau rendez-vous ».

### Foto (galleria e logo)

1. Il telefono riduce la foto a 2400 px prima dell'invio, così il caricamento resta veloce anche in 4G.
2. Il server la converte in WebP (1600 px per la galleria, 512 px per il logo) e la raddrizza secondo l'orientamento EXIF.
3. Toglie i metadati, compresa la posizione GPS.
4. La salva nel bucket pubblico `media` di Supabase Storage.

Eliminando una foto si elimina anche il file. Il sito la mostra tramite l'ottimizzatore di immagini di Next.js (`remotePatterns`).

## Scelte e limiti

- **Eliminare una cliente dall'admin:** non è previsto. La cancellazione RGPD la fa la cliente da Mon espace. Una richiesta arrivata a voce si gestisce per ora a mano su Supabase. Si può aggiungere un pulsante se Alessia lo ritiene utile.
- **Le varianti si eliminano davvero.** Lo storico non ne risente, perché gli appuntamenti conservano nome, durata e prezzo al momento della prenotazione.
- **Il link di una prestazione non cambia rinominandola:** lo slug resta lo stesso, quindi i link già condivisi continuano a funzionare.
- **SMS:** non sono gestiti. L'interfaccia di invio esiste, ma non è collegata a un fornitore.
