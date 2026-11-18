# Decisioni prese (18/11/2026)

Regola data dal committente: **in caso di conflitto tra sito attuale e brief vale il brief.** Per ciò che il brief non specifica restano i dati del sito attuale. Tutto è modificabile dall'admin.

| # | Tema | Decisione | Fonte |
|---|---|---|---|
| D1 | Orari | Lun–ven 10:00–14:00 e 14:30–20:00. Sabato 10:00–14:30 (il brief dice solo "chiude prima", quindi l'orario esatto viene dal sito). Domenica chiuso. | brief + sito |
| D2 | Partenze | 10:00, 12:00, 14:30, 16:00, 18:00; dalle 18:00 "Sur demande" salvo sblocco giornaliero | brief |
| D3 | Extension Cils | 1 h 45 | brief |
| D4 | Extension Cils Remplissage | 1 h 30 (posa − 15 min) | brief |
| D5 | Rehaussement Cils, Browlift | 1 h ciascuno | brief |
| D5b | Rehaussement Cils Avec Teinture, Browlift Avec Teinture e altre prestazioni | durate del sito (1 h, 1 h 10, …) | sito |
| D6 | Stili di posa | La struttura a varianti è pronta, ma non creo varianti finché Alessia non comunica i nomi (non li invento). | — |
| D7 | Catalogo | Tutte le 13 prestazioni del sito, una sola categoria « Prestations » | sito |
| D8 | Pagamento online | **Non previsto** (il brief non lo chiede). L'importo dell'acconto resta come informazione. | brief |
| D9 | Prezzi | Prezzi pieni noti: Épilation sourcils 16 €, Teinture sourcils 25 €, Épilation moustache 10 €, Dépose 20 € (10 € se seguita da nuova posa). Per le altre il prezzo resta vuoto e il sito mostra l'acconto ("Acompte 20 €"). Alessia completerà dall'admin. | sito |
| D10 | Prenotazione | Una prestazione (+ variante) per prenotazione | brief |
| D11 | Annullamento | Fino a 24 h prima, configurabile | brief |
| D12 | Finestra / preavviso | 60 giorni / 2 h | brief |
| D13 | Nome e logo | « Lady A Beauty »; logo attuale finché Alessia non carica il nuovo | brief |
| D14 | Bio | Testo del sito (diplomata 2019) con refusi corretti | sito |
| D15 | Indirizzo | « 49 avenue de Verdun, 74100 Annemasse » (registro INSEE/RNE, 18/11/2026) | registro pubblico |
| D16 | Account | Codice OTP via email (con magic link nella stessa email), password facoltativa | proposta |
| D17 | Lista d'attesa | Opzione (b): esclusiva di 30 min in ordine di iscrizione, avviso a tutte se lo slot è a meno di 12 h | proposta |
| D18 | Job | Supabase pg_cron ogni 5 min | proposta |
| D19 | Testi | Refusi evidenti delle descrizioni corretti senza cambiarne il senso | brief (§3) |

## Ancora aperti (non bloccanti)
- Nomi degli stili di posa (varianti dell'Extension).
- Prezzi pieni di 9 prestazioni.
- Le descrizioni del sito parlano di « acompte … + 0,94 € de frais de transaction », legati al pagamento online di Book in Beautiful che non avremo. Alessia dovrà decidere come raccogliere l'acconto (es. in DM / bonifico) e aggiornare il testo.
- Telefono dello studio (facoltativo nelle mentions légales). Numero civico, forma giuridica e SIRET sono risolti: vedi sotto.
- Dominio e mittente email.

## Dati legali (dal registro pubblico, 18/11/2026)

Fonte: scheda indicata dal committente (Le Figaro Entreprises), verificata sull'API ufficiale « Recherche d'entreprises » (INSEE/RNE).

- **Forma giuridica:** entrepreneur individuel (EI), titolare Alessia Rubulotta. Dal 2022 la menzione « EI » deve comparire accanto al nome.
- **SIREN:** 984 040 113. **SIRET** della sede: 984 040 113 00016.
- **Sede:** 49 avenue de Verdun, 74100 Annemasse. Le coordinate GPS del registro alimentano schema.org e la mappa.
- **Attività:** NAF 96.02B (soins de beauté). Data di creazione: 19/02/2024. Stato: attiva.
- **Non pubblicati:** la data di nascita e gli altri dati personali del registro non vengono mostrati sul sito.
- **Partita IVA:** non indicata nel registro. Se Alessia è in franchigia (micro-impresa), sulle fatture va « TVA non applicable, art. 293 B du CGI ». Il sito non la mostra finché non è confermata.
