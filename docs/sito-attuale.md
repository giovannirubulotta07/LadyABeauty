# Analisi del sito attuale — Lady A Beauty (Book in Beautiful)

- **Sito analizzato:** https://ladyabeauty.bookinbeautiful.fr
- **Data dell'analisi:** 18 novembre 2026
- **Metodo:** Chromium headless (Playwright), fuso orario Europe/Paris, lingua fr-FR. Ho letto home, `/book`, `/gallery`, `/terms_and_conditions`, `/privacy_policy`, `/cookie_policy` e simulato il flusso di prenotazione fino alla scelta dell'orario per 4 prestazioni e 7 giorni, **senza confermare nulla**. Il passaggio successivo all'orario richiede login, quindi **non ho creato account** sul sistema reale di Alessia.
- **Instagram:** letto il profilo pubblico (bio + anteprime degli ultimi post). Le immagini Instagram **non** sono state copiate nel repository (alcune sembrano foto d'atmosfera non sue).

I testi in francese sono riportati **alla lettera**, refusi compresi (segnalati con ⚠︎).

---

## 1. Identità

| Voce | Valore sul sito |
|---|---|
| Nome commerciale | **LADY A BEAUTY** (titolo pagine, og:title, intestazione indirizzo "LADY A BEAUTY, Annemasse") |
| Logo | ⚠︎ Il logo dice **"Lady A Cils – Beauty Studio"**: scritta rosa neon su fondo nero con illustrazione di un volto femminile al tratto. File: `G._Logo_-_Lady_A._Cils__Black_.jpeg`, 650×649 px (JPEG, nessuna versione vettoriale). |
| Colori attuali del sito | Fascia rosa `#de8ec1`, navigazione grigia trasparente, fondo bianco (template Book in Beautiful). Da abbandonare per la nuova palette. |
| Instagram | https://www.instagram.com/lady.a_beauty/ — 2 249 follower, 114 post |
| Email pubblica | `alessiarubu98@gmail.com` (compare solo nella politique de confidentialité, come contatto RGPD) |
| Telefono | **Non presente** sul sito |
| Pagamenti accettati (footer) | **Mastercard, Visa** (pagamento online tramite Stripe, integrato in Book in Beautiful) |

### Bio di Instagram (alla lettera)
> ANNEMASSE EXTENSION DE CILS ~ SOURCILS ~ REHAUSSEMENT DE CILS
> 🇮🇹Certifié secteur esthétique 2017
> Beauté du regard x5👩🏻‍🎓
> PRISE DE RENDEZ-VOUS EN BIO👇🏼
> ISOLATION ET DURÉE ASSURÉE ‼️
> Vivez pleinement l'expérience

### Estetica recente su Instagram
Confermata la svolta descritta nel brief: foto calde e scure, molti tessuti **leopardati** (cappotti, pellicce, sfondi), toni marrone/cammello/nero, dettagli oro, tipografia serif maiuscola ("DISCIPLINE."). Il logo neon rosa compare ancora in alcuni post ma stona con la nuova estetica.

---

## 2. Indirizzo

> LADY A BEAUTY, Annemasse
> Avenue de Verdun
> 74100 Annemasse

⚠︎ **Manca il numero civico.** Il sito non espone coordinate GPS né dati strutturati. Per link mappa e schema.org serve l'indirizzo completo.

---

## 3. Orari di apertura (home)

| Giorno | Orari |
|---|---|
| lundi | 10:00 – 14:00 · 14:30 – 18:30 |
| mardi | 10:00 – 14:00 · 14:30 – **19:45** |
| mercredi | 10:00 – 14:00 · 14:30 – 18:30 |
| jeudi | 10:00 – 14:00 · 14:30 – **19:45** |
| vendredi | 10:00 – 14:00 · 14:30 – 18:30 |
| samedi | 10:00 – 14:30 (senza pausa) |
| dimanche | Fermé |

---

## 4. Testi di presentazione (home)

Titolo hero: **« Bienvenue chez LADY A BEAUTY »** + bottone « Réserver »

Sezione « - À propos de moi - », titolo « Lady A Beauty »:

> Bienvenue chez LADY A BEAUTY, votre espace beauté.
>
> Je suis Alessia, Lash Maker et Brows Artist
>
> Diplômée depuis 2019 dans le secteur de l'esthétique et spécialisé dans la beauté du regard en 2021 en Italie.
>
> Je suis prêt à sublimer votre regard, restant à l'écoute pour vous offrir prestations sur mesure selon votre préférence, tout en partageant des conseils dans une atmosphère douce et chaleureuse.

⚠︎ Refusi/accordi: « spécialisé » → « spécialisée », « Je suis prêt » → « Je suis prête », « vous offrir prestations » → « vous offrir des prestations ».
⚠︎ Incoerenza: il sito dice « Diplômée depuis **2019** », Instagram « Certifié secteur esthétique **2017** ».

Sezione « - Contactez-nous - »: solo l'icona Instagram.

---

## 5. Prestazioni (pagina `/book`)

Un'unica categoria: **« Prestations »** (13 prestazioni). Il sito permette di selezionare **fino a 5 prestazioni** nella stessa prenotazione. **Nessuna variante** selezionabile: non c'è un passaggio di scelta dello stile di posa.

Legenda: il sito mostra per molte prestazioni un prezzo « à partir de 21,00 € », che corrisponde all'**acconto** (20 €) + 0,94 € di commissione, **non al prezzo della prestazione**.

| # | Nome (esatto) | Durata | Prezzo mostrato | Note |
|---|---|---|---|---|
| 1 | Extension Cils | 1 h 50 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 2 | Extension Cils Remplissage | 1 h 30 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 3 | Dépose | 20 min | à partir de 10,00 € | 20 €, oppure 10 € se seguita da nuova posa |
| 4 | Épilation Sourcils | 15 min | **16,00 €** | prezzo pieno |
| 5 | Browlift | 45 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 6 | Browlift Avec Teinture | 1 h 10 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 7 | Rehaussement Cils | 45 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 8 | Rehaussement Cils Avec Teinture | 1 h | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 9 | Shading/Microblanding ⚠︎ | 2 h | à partir de 50,00 € | acconto 50 € |
| 10 | Blanchiment Dentaire | 1 h | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 11 | Tâches De Rousseurs ⚠︎ | 1 h 10 min | à partir de 21,00 € | acconto 20 € + 0,94 € |
| 12 | Teinture Sourcils | 30 min | **25,00 €** | prezzo pieno, nessuna descrizione |
| 13 | Épilation Moustache | 10 min | **10,00 €** | prezzo pieno, nessuna descrizione |

⚠︎ **Prezzi pieni non leggibili** per le prestazioni 1, 2, 5, 6, 7, 8, 9, 10, 11: il sito indica solo l'acconto. Non li ho indovinati.

### Descrizioni (alla lettera, paragrafi vuoti omessi)

**1. Extension Cils**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> Merci de me contacter en DM pour m'indiquer la pose choisie.
>
> L'acompte n'est pas remboursable.

**2. Extension Cils Remplissage**
> Le emplissage est uniquement entre le 3 semaine du jour de la pose complète. Après ce délai il foudra payer la pose complète.
>
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> L'acompte n'est pas remboursable.

⚠︎ « Le emplissage » → « Le remplissage », « entre le 3 semaine » → « dans les 3 semaines suivant », « il foudra » → « il faudra ».

**3. Dépose**
> Le prix de la dépose est de €20.
>
> Pour qui effectue la dépose et en suite nouvelle pose d'extensions cils, le prix de la dépose est réduit à €10.

**4. Épilation Sourcils**
> Sì vous annulez le rendez-vous, le payement n'est pas remboursable.

⚠︎ « Sì » (italiano) → « Si », « payement » → « paiement ».

**5. Browlift**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> L'acompte n'est pas remboursable.

**6. Browlift Avec Teinture**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais d'envoi.

⚠︎ « frais d'envoi » invece di « frais de transaction »; manca la frase sull'acconto non rimborsabile.

**7. Rehaussement Cils**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> L'acompte n'est pas remboursable.

**8. Rehaussement Cils Avec Teinture**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais transaction.
>
> L'acompte n'est pas remboursable.

**9. Shading/Microblanding**
> Le prix de €50 est l'acompte pour la réservation.
>
> L'avompte n'est pas rembursable.

⚠︎ « Microblanding » → « Microblading », « L'avompte n'est pas rembursable » → « L'acompte n'est pas remboursable ».

**10. Blanchiment Dentaire**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> L'acompte n'est pas remboursable.

**11. Tâches De Rousseurs**
> Le prix de €20 est l'acompte pour la réservation + €0,94 de frais de transaction.
>
> L'acompte n'est pas remboursable.

⚠︎ « Tâches » → « Taches de rousseur » (senza accento circonflesso).

**12. Teinture Sourcils** e **13. Épilation Moustache**: nessuna descrizione.

---

## 6. Flusso di prenotazione attuale

1. **Prestazioni**: selezione multipla (max 5), bottone « Suivant ».
2. **Giorno**: griglia di riquadri colorati: verde = disponibile, rosso = pieno, grigio = chiuso (domenica). Bottone « Afficher plus de dates » e link « Trouvez le prochain rendez-vous disponible ».
   - **Finestra di prenotazione osservata: 8 settimane** (dal 18/11/2026 al 12/01/2027 compreso).
   - Al momento dell'analisi tutti i giorni fino al 2 dicembre sono pieni; anche dal 22/12 al 3/01 tutto pieno (probabilmente ferie natalizie bloccate).
3. **Orario**: lista di orari per « Alessia » (unica operatrice). La pagina mostra una griglia completa a passi di 5 minuti, ma solo pochi orari sono cliccabili. Orari realmente proposti in questo momento:

   | Giorno | Prestazione | Orari proposti |
   |---|---|---|
   | gio 3/12 | Extension Cils (1h50) | 10:00, 16:20 |
   | gio 3/12 | Browlift (45 min) | 10:00, 16:20 |
   | gio 3/12 | Shading (2h) | 10:00, 16:20 |
   | gio 3/12 | Épilation Sourcils (15 min) | 10:00, 16:20, 18:30 |
   | mer 9/12 | Extension Cils | 11:30 |
   | mar 15/12 | Extension Cils | 14:30, 16:30 |
   | mer 2/12, sab 12/12, sab 21/11 | Extension Cils | nessuno |

4. **Account obbligatorio** (login o registrazione) prima di confermare. Modulo di iscrizione:
   - Prénom et nom, E-mail, Numéro de téléphone portable, Mot de passe (6 caractères minimum), Confirmation du mot de passe;
   - 3 campi **honeypot** nascosti (« Veuillez laisser le champ suivant vide »);
   - Préférences de contact: newsletter via Email Oui/Non, via SMS Oui/Non (« Souhaitez-vous recevoir des informations et des offres exclusives de LADY A BEAUTY ? Vous pouvez vous désinscrire à tout moment. »);
   - casella obbligatoria « J'ai lu, compris et j'accepte les conditions ci-dessus » (politique de confidentialité + conditions générales);
   - verifica dell'email obbligatoria prima di prenotare.
5. **Pagamento dell'acconto** online con carta (Stripe) per le prestazioni con acconto. Non ho potuto vedere questa schermata senza account.

---

## 7. Condizioni di prenotazione e annullamento

Non esiste una pagina di condizioni propria di Alessia. Le uniche regole specifiche sono nelle descrizioni delle prestazioni:

- **Acconto non rimborsabile**: 20 € (+0,94 € di commissione) per la maggior parte delle prestazioni, 50 € per Shading/Microblading.
- **Épilation sourcils**: « si vous annulez le rendez-vous, le paiement n'est pas remboursable ».
- **Remplissage**: solo entro 3 settimane dalla posa completa, altrimenti si paga la posa completa.
- **Dépose**: 10 € invece di 20 € se seguita da una nuova posa.
- **Scelta dello stile di posa**: comunicata in DM su Instagram.

La pagina `/terms_and_conditions` contiene le **condizioni della piattaforma** (Nearcut Vertriebs-UG, Berlino), non quelle dello studio. Punti utili:
- se la cliente non può venire deve annullare dal sistema, altrimenti è dovuto l'intero prezzo;
- in caso di annullamento « dans les conditions d'annulation du salon » i prepagamenti sono rimborsati, altrimenti no;
- **nessun termine di annullamento in ore è indicato** da nessuna parte.

→ In assenza di una regola, applicherò il default del brief: **annullamento possibile fino a 24 h prima**, configurabile (vedi domande).

---

## 8. Pagine legali

- **Politique de confidentialité** (modello Book in Beautiful del 23/05/2018): titolare del trattamento = lo studio; contatto RGPD `alessiarubu98@gmail.com`; conservazione: dati commerciali per la durata della relazione, prospezione 3 anni, account inattivo 2 anni, cookie 13 mesi; diritti di accesso, rettifica, cancellazione, opposizione, limitazione, portabilità, reclamo alla CNIL. Cita come subprocessore Nearcut (da sostituire con Supabase, Vercel, Resend).
- **Charte cookies**: cookie tecnici (sessione, « rester connecté ») + cookie di misura d'audience; banner di consenso.
- **Mentions légales**: **assenti**. Mancano ragione sociale, SIRET, indirizzo completo, contatto, hosting: obbligatori in Francia (LCEN, art. 6).

---

## 9. Galleria e logo (copiati in `docs/assets/sito-attuale/`)

| File | Originale | Dimensioni | Note |
|---|---|---|---|
| `logo-lady-a-cils.jpeg` | `JBKTDH/G._Logo_-_Lady_A._Cils__Black_.jpeg` | 650×649 | logo neon rosa su nero, JPEG |
| `galerie-01-IMG_8228.jpg` | `9ZCDR2/IMG_8228.jpeg` | 1537×2732 | foto iPhone 11, luglio 2025 (anche immagine di sfondo dell'hero attuale) |
| `galerie-02-IMG_0530.jpg` | `TLXFJC/IMG_0530.png` | 1257×2732 | screenshot: barra di stato iPhone e bande nere |
| `galerie-03-IMG_8223.jpg` | `BKCGNS/IMG_8223.png` | 828×1792 | screenshot con bande nere |
| `galerie-04-IMG_0526.jpg` | `SRBFN7/IMG_0526.jpeg` | 1257×2732 | bande nere sopra e sotto |
| `galerie-05-IMG_0429.jpg` | `W05HBN/IMG_0429.png` | 1257×2732 | screenshot con indicatore home iPhone |
| `galerie-06-IMG_0428.jpg` | `UENGC0/IMG_0428.jpeg` | 1257×2732 | screenshot con indicatore home iPhone |

Ordine = ordine della galleria attuale. Le PNG (screenshot) sono state convertite in JPEG qualità 95 per alleggerire (una pesava 12,5 MB). Le immagini sono state scaricate alla risoluzione massima disponibile sul CDN.

⚠︎ 5 foto su 6 sono **screenshot del telefono** con bande nere e barre di sistema: andranno ritagliate per la nuova galleria.

---

## 10. Differenze rispetto al brief (da decidere)

| # | Tema | Brief | Sito attuale |
|---|---|---|---|
| D1 | **Orari** | 10:00–20:00 con pausa 14:00–14:30; sabato chiude prima | Lun/mer/ven chiusura **18:30**; mar/gio **19:45**; sabato 10:00–**14:30** senza pausa |
| D2 | **Slot 18:00** | partenza 18:00 bloccata, "sur demande" | Con chiusura 18:30 o 19:45 una Extension (1h50) delle 18:00 **non entra mai**, nemmeno sbloccata |
| D3 | **Durata Extension** | ~1h45 | **1h50** |
| D4 | **Durata Remplissage** | 15 min meno della posa | **1h30** (20 min meno) |
| D5 | **Rehaussement / Browlift** | ~1h ciascuno | **45 min**; con teinture 1h / 1h10 |
| D6 | **Stili di posa (varianti)** | più stili, stessa durata | **nessuna variante**: lo stile si comunica in DM |
| D7 | **Catalogo** | descrive 4 prestazioni principali | **13 prestazioni**, tra cui Shading/Microblading, Blanchiment dentaire, Taches de rousseur, épilations, teinture |
| D8 | **Pagamento** | non menzionato | **acconto online obbligatorio** (20 €/50 €) con carta, non rimborsabile |
| D9 | **Prezzi** | da riprendere dal sito | solo acconti visibili per 9 prestazioni su 13 |
| D10 | **Prenotazione multipla** | una prestazione (+ variante) | fino a **5 prestazioni** insieme |
| D11 | **Annullamento** | default 24h se il sito non dice nulla | nessun termine; acconto non rimborsabile |
| D12 | **Finestra di prenotazione** | default 60 giorni | **8 settimane** (56 giorni) |
| D13 | **Nome / logo** | Lady A Beauty | logo "Lady A Cils – Beauty Studio" |
| D14 | **Anno di diploma** | — | sito 2019, Instagram 2017 |
| D15 | **Indirizzo** | quello del sito | senza numero civico |
| D16 | **Account** | magic link, password opzionale | password obbligatoria + verifica email |

## 11. Dati non leggibili / mancanti

- Prezzi pieni di 9 prestazioni (vedi §5).
- Numero civico dell'indirizzo; telefono dello studio.
- Nomi degli stili di posa delle extension.
- Termine di annullamento in ore.
- Preavviso minimo attuale (impossibile da misurare: i prossimi giorni sono tutti pieni).
- Dati per le mentions légales: forma giuridica (micro-entreprise?), nome legale, SIRET, eventuale n° di partita IVA.
- Pagamento in studio: contanti/carta? Il sito mostra solo Visa/Mastercard online.
