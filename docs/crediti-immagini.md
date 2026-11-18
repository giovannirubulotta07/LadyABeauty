# Provenienza delle immagini

| Cartella                                  | Contenuto                                                                                               | Origine e diritti                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `public/galerie/`                         | Lavori di Alessia (6 foto)                                                                              | Sito attuale di Alessia, ritagliate (`scripts/prepare-gallery.mts`). Di sua proprietà. |
| `public/editorial/regard-*-editorial.jpg` | Le stesse foto con un leggero viraggio caldo                                                            | Solo colore e tono (`scripts/grade-photos.mts`), nessun ritocco del risultato.         |
| `public/patterns/leopard.svg`             | Motivo leopardato vettoriale, usato in pochi dettagli (cornice della prenotazione, fascia delle e-mail) | Disegno originale (`scripts/generate-leopard.mts`).                                    |

## Regole (decisione del committente, 18/11/2026)

- **Nessun elemento generato o puramente decorativo:** niente texture, sfondi « fotografici » sintetici o immagini create con l'IA. Sono stati tolti:
  - le sete e i satin generati;
  - il motivo leopardato generato (cornice della prenotazione, fascia delle e-mail, immagine di condivisione);
  - la fascia di testo che scorre e la linea animata « Défiler »;
  - le scritte giganti in filigrana (« Alessia », « Lady A »);
  - la numerazione decorativa (001, 01…).

  Restano: il colore pieno, la tipografia, le foto reali di Alessia e le animazioni di comparsa dei contenuti.

- **Niente vecchio logo:** il logo « Lady A Cils – Beauty Studio » non compare più da nessuna parte, favicon compresa.
  - Il marchio è il nome in Bodoni (« Lady A Beauty »).
  - La favicon è una « A » tipografica generata dal codice (`src/lib/monogram.tsx`).
  - Un nuovo logo si potrà caricare dall'admin (Réglages → Studio).
- **Nessuna foto di stock** che mostri un viso, un occhio o un risultato. Gli spazi fotografici (hero, « À propos », collage) sono pronti per le foto dello shooting professionale.
