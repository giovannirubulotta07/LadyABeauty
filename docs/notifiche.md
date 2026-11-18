# Email e promemoria (fase 4)

## Quali email partono

| Evento | Cliente | Alessia | Chiave di idempotenza |
|---|---|---|---|
| Prenotazione confermata (online) | « Rendez-vous confirmé » con dettagli, mappa, « Gérer mon rendez-vous », .ics | « Nouveau rendez-vous » con telefono cliccabile e messaggio della cliente | `confirmation:<id>` · `owner-booking:<id>` |
| Promemoria (giorno prima, dalle 9:00) | « À demain ! » | — | `reminder:<id>:<inizio>` |
| Annullamento da parte della cliente (Mon espace o link nell'email) | « Rendez-vous annulé » + « Reprendre rendez-vous » | « Annulation » | `cancellation:<id>` · `owner-cancellation:<id>` |
| Account eliminato con appuntamenti futuri | — | « Annulation » per ognuno | come sopra |
| Annullamento / spostamento da parte di Alessia (fase 6) | email dedicata | — | idem |

- Le notifiche ad Alessia possono essere disattivate (tabella privata `studio_private_settings`, modificabile dall'admin nella fase 6). L'indirizzo di notifica **non è pubblico**.
- Il link « Gérer mon rendez-vous » (`/rdv/<token>`) funziona senza login: il token è firmato (HMAC), contiene solo l'id dell'appuntamento e scade 2 ore dopo la fine.

## Mai due volte la stessa email

Ogni messaggio ha una chiave unica in `notification_log`. Prima di inviare, `claim_notification` registra la chiave in modo atomico:
- se la chiave esiste già, l'invio viene saltato. Lo provano 20 tentativi simultanei e 5 esecuzioni parallele del job;
- un nuovo tentativo (al massimo 3) è permesso solo dopo un **errore esplicito** del provider, mai quando l'esito è incerto;
- un appuntamento spostato riceve un nuovo promemoria, perché la chiave contiene l'orario.

L'invio avviene dopo la risposta (`after()`): un'email lenta o fallita non blocca né annulla mai una prenotazione.

## Promemoria

- **Regola** (`src/domain/notifications/reminder.ts`): il promemoria parte dalle **9:00 (ora di Parigi) del giorno prima**. Chi prenota dopo quell'ora (per esempio la sera prima) non lo riceve: ha appena ricevuto la conferma. L'orario si cambia in `business_settings.reminder_send_time`.
- **Job**: `/api/cron/taches`, protetto da `CRON_SECRET`. Invia i promemoria dovuti e applica le durate di conservazione: contatori anti-abuso oltre 24 h, registro email oltre 12 mesi.
  - Principale: **Supabase pg_cron** ogni 5 minuti (vedi sotto).
  - Riserva: **Vercel Cron** una volta al giorno (`vercel.json`, 08:10 UTC), perché il piano Hobby non permette di più.
  - In locale: `npm run cron`.

## Configurazione in produzione

1. **Resend**: creare un account, aggiungere il dominio (es. `ladyabeauty.fr`) e pubblicare i record DNS indicati (SPF `TXT`, DKIM `TXT`/`CNAME`, consigliato DMARC `TXT _dmarc`). Il README della fase 7 riporterà i dettagli.
2. Variabili su Vercel: `RESEND_API_KEY`, `EMAIL_FROM="Lady A Beauty <rendez-vous@ladyabeauty.fr>"`, facoltativo `EMAIL_REPLY_TO`, `CRON_SECRET` (32+ caratteri casuali).
3. Pianificazione (una volta, nel SQL editor di Supabase):
   ```sql
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   select public.schedule_studio_jobs('https://ladyabeauty.fr');
   ```
4. Indirizzo di notifica di Alessia: `update studio_private_settings set notification_email = '…';` (dall'admin nella fase 6).

## Aggiungere gli SMS in futuro

`src/server/notifications/channels.ts` definisce `SmsChannel`. Basta:
1. implementare `send()` con un provider (es. Brevo, Twilio, OVH);
2. aggiungere il canale `"sms"` in `deliver()`, che è già previsto nel registro (`notification_log.channel`);
3. aggiungere un testo breve per evento negli `events`.

I template email, le chiavi di idempotenza e gli eventi restano invariati.

## Anteprima dei template

`npm run email:preview` scrive l'HTML di ogni email in `.email-preview/`. In locale le email vere arrivano in Mailpit: http://127.0.0.1:54324.
