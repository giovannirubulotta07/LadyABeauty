# Vedere il sito in un GitHub Codespace

Un Codespace è un computer virtuale di GitHub che avvia l'intero sito: database, prenotazione, e-mail di prova e admin. Il sito si apre nel browser, senza installare niente.

## Avvio

1. Apri il link:
   https://codespaces.new/giovannirubulotta/LadyABeauty/tree/ccr-a37bc204-u39hve?quickstart=1
2. Clicca **Create codespace**. Il primo avvio richiede circa 5–8 minuti: installazione, database, costruzione del sito.
3. Al termine il terminale mostra:
   - l'indirizzo del sito, nella forma `https://….app.github.dev`;
   - l'indirizzo dell'admin e la password dell'account di prova, generata per questo Codespace.

   Il sito si apre anche da solo in una nuova scheda; altrimenti apri la scheda **Ports** e clicca l'icona del globo accanto alla porta 3000.

## Da sapere

- **Dati di prova:** le clienti « Cliente Test » e gli appuntamenti sono finti. Tutto ciò che fai nel Codespace resta lì e non tocca il sito vero.
- **E-mail:** non partono davvero. Le trovi nella porta **54324** (Mailpit), compresi i codici di accesso a 6 cifre per « Mon espace ».
- **Condividere il link:** lo script prova a rendere pubblica la porta 3000. Se qualcuno non riesce ad aprirlo, nella scheda **Ports**: clic destro sulla porta 3000 → *Port visibility* → *Public*.
- **Costi:** i Codespace sono gratuiti entro la quota mensile dell'account GitHub. Si fermano da soli dopo 30 minuti di inattività. Quando hai finito, eliminalo da https://github.com/codespaces.
- **Riavvio:** quando il Codespace si riaccende, il sito riparte da solo. Per riavviarlo a mano: `bash scripts/codespace-start.sh`.

Il sito definitivo, con dominio e e-mail vere, andrà su Vercel e Supabase: vedi il README (fase 7).
