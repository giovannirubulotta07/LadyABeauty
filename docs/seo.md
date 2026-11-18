# SEO e controlli tecnici (18/11/2026)

## Cosa fa il sito

- **Titoli e descrizioni:** ogni pagina pubblica ha titolo, descrizione e URL canonico propri, e anche un'anteprima di condivisione propria (titolo, descrizione, URL e immagine per WhatsApp, Facebook, iMessage).
  - Home: « Lady A Beauty · Extension de cils & sourcils à Annemasse », con descrizione che cita Annemasse e Genève.
  - La pagina 404 ha il suo titolo e non viene indicizzata.
- **Dati strutturati (schema.org BeautySalon)** con:
  - indirizzo completo e coordinate GPS;
  - orari, Instagram e zona servita (Annemasse, Genève);
  - foto reali e fascia di prezzo;
  - catalogo delle prestazioni con link di prenotazione diretta. Contiene solo i prezzi reali: un acconto non viene mai presentato come prezzo.
- **Sitemap con le immagini:** le foto di Alessia sono collegate alla home e alla galleria (Google Immagini).
- **robots.txt:** esclude admin, Mon espace, pagine aperte dai link nelle e-mail, conferma e API.
- **Manifest:** il sito si può aggiungere alla schermata home del telefono, con icona tipografica.

## Sicurezza

- **Header su tutte le risposte:**
  - `nosniff`;
  - divieto di essere incorporato in un'altra pagina (`X-Frame-Options`, `frame-ancestors`);
  - `Referrer-Policy`, `Permissions-Policy` e HSTS;
  - `form-action 'self'`;
  - nessun header `X-Powered-By`.
- **Pagine con token** (`/rdv`, `/liste-attente`, `/api/ics`): `Referrer-Policy: no-referrer`, così il link firmato non arriva mai a un altro sito.
- **Content-Security-Policy completa:** non è attiva, perché richiederebbe un nonce per ogni richiesta e renderebbe dinamiche tutte le pagine. Le direttive che non rompono nulla (frame, base, form, object) sono attive.

## Misure

**Lighthouse mobile:**

| Pagina           | Performance | Accessibilità | Best practices | SEO |
| ---------------- | ----------- | ------------- | -------------- | --- |
| Accueil          | 96          | 100           | 100            | 100 |
| Prestations      | 97          | 100           | 100            | 100 |
| Galerie          | 95          | 100           | 100            | 100 |
| Réserver         | 99          | 100           | 100            | 100 |
| Mentions légales | 99          | 100           | 100            | 100 |

**Altri controlli:**

- link interni verificati: nessuno rotto;
- nessun errore o avviso nella console del browser, su computer e telefono.

## Da fare fuori dal sito (alla messa online)

1. **Google Search Console:** verificare il dominio e inviare la sitemap (`/sitemap.xml`).
2. **Scheda Google Business Profile di Lady A Beauty:**
   - indirizzo « 49 avenue de Verdun » identico al sito;
   - link al nuovo sito e al link di prenotazione `/reserver`;
   - orari aggiornati.
3. **Instagram:** il link in bio deve puntare alla nuova prenotazione invece di Book in Beautiful.
4. **Vecchio sito Book in Beautiful:** chiuderlo o farlo puntare al nuovo, per non avere due siti con gli stessi contenuti.
5. **Recensioni:** chiedere alle clienti soddisfatte una recensione su Google. È il fattore che conta di più per comparire nella mappa su « extension cils Annemasse ».
