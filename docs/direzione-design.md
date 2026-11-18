# Nuova direzione visiva — riferimento ever.co.id

Richiesta del 18/11/2026: design lussuoso, solo foto di alta qualità, livello "agenzia specializzata in design e animazioni", ispirato a https://www.ever.co.id/.
Questa richiesta **sostituisce** due vincoli del brief iniziale: "una sola micro-animazione" e "leopardato solo in pochi punti" (il secondo resta valido nello spirito: niente leopardato dietro al testo).
Restano invariati: accessibilità AA, `prefers-reduced-motion`, mobile first, Lighthouse ≥ 95.

## Cosa rende ever.co.id "da agenzia" (analisi)

| Elemento                | Come lo fa ever                                                                                                                                           | Come lo traduco per Lady A Beauty                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Colore**              | Un solo fondo pieno, marrone caldo (#7A6047), testo bianco ovunque: effetto cinematografico                                                               | Fondo **espresso/cammello** a tutta pagina e testo avorio; il sabbia resta per le sezioni "carta" (prenotazione, Mon espace). Il leopardato diventa una **texture fotografica** (tessuto) nelle composizioni, non un motivo grafico |
| **Tipografia**          | Serif editoriale enorme (Bradford, 126 px) + sans light maiuscolo con molta aria (Maax Light 80 px)                                                       | Bodoni Moda per i titoli giganti (fino a 9–10 rem), **Jost Light maiuscolo** con interlinea ampia per i titoli secondari, etichette piccolissime spaziate                                                                           |
| **Header**              | Hamburger a sinistra, wordmark spaziato al centro, "Make an appointment" piccolo a destra; menu a schermo intero                                          | Stessa struttura; menu a schermo intero con voci in Bodoni enorme e immagine che cambia al passaggio                                                                                                                                |
| **Hero**                | Ritratto editoriale a tutto schermo (anche video), titolo serif sovrapposto, "scroll to explore"                                                          | Foto o video a tutto schermo, "Lady A Beauty" in serif gigante con apparizione riga per riga, indicazione di scorrimento                                                                                                            |
| **Scroll storytelling** | GSAP ScrollTrigger: collage di texture che scorrono a velocità diverse (parallasse) attorno a un titolo; testo gigante semitrasparente dietro ai ritratti | Collage parallasse (texture: seta, leopardato, ciglia in macro) attorno a "L'ART DU REGARD"; "LADY A" gigante in filigrana dietro alla foto                                                                                         |
| **Movimento**           | Lenis (scroll fluido), SplitType (testi che si rivelano riga per riga), maschere sulle immagini, marquee                                                  | Lenis + GSAP/ScrollTrigger + SplitText: titoli rivelati, immagini che si "aprono" con una maschera, marquee « Lash maker · Brow artist · Annemasse », numeri 01/02/03 sulle prestazioni                                             |
| **Prestazioni**         | Elenco numerato (001, 002…), immagine che appare al passaggio del mouse                                                                                   | Elenco editoriale numerato con durata e prezzo; su desktop l'immagine segue il cursore, su mobile card fotografiche                                                                                                                 |
| **Chiusura**            | FAQ a fisarmonica, footer con wordmark gigante                                                                                                            | FAQ (acconto, annullamento, remplissage entro 3 settimane…), footer con "LADY A" gigante e CTA prenotazione                                                                                                                         |

## Tecnica (performance e accessibilità)

- **Librerie:** GSAP (oggi interamente gratuito, plugin inclusi) con ScrollTrigger e SplitText, più Lenis, circa 45 KB compressi. Vengono caricate dopo il primo rendering, quindi non rallentano l'LCP.
- **Visibile senza JavaScript:** il titolo dell'hero è visibile subito anche senza JS. L'animazione parte da uno stato già leggibile, quindi niente schermo vuoto.
- **`prefers-reduced-motion`:**
  - niente scroll fluido né parallasse;
  - i testi compaiono senza movimento;
  - il video dell'hero è sostituito da un'immagine.
- **Mobile:**
  - lo scroll resta quello nativo (Lenis solo su desktop);
  - parallasse più leggera;
  - immagini in AVIF/WebP via `next/image`;
  - video in formato mobile compresso (meno di 2 MB) con poster.
- **Prenotazione e Mon espace restano sobri** (fondo sabbia, nessuna animazione decorativa): lì contano velocità e chiarezza.

## Il nodo delle foto

Il look di ever si regge su **fotografia editoriale professionale** (ritratti in studio, macro, texture, video). Le 6 foto attuali sono screenshot di telefono: vanno bene come prova del lavoro, ma non reggono un hero a tutto schermo.
**Decisione del committente: "1+2".**

1. Più avanti ci sarà un **servizio fotografico professionale**. Tutte le immagini editoriali sono in `public/editorial/` e si sostituiscono senza toccare il codice: stesso nome file, stesso formato.
2. ~~Per l'atmosfera si usano solo texture.~~ **Aggiornamento del 18/11/2026:** il committente non vuole elementi generati. Le texture sono state tolte; restano solo le foto reali di Alessia, il colore pieno e la tipografia. Anche il vecchio logo è stato ritirato (vedi `crediti-immagini.md`).

   Le texture sono **originali**, generate con uno shader WebGL (`scripts/textures/`), quindi senza problemi di licenza. Le foto dei lavori sono quelle reali di Alessia, ritoccate nel colore (`scripts/grade-photos.mts`). Le provenienze sono in `docs/crediti-immagini.md`.

## Cosa è stato realizzato

- **Header sovrapposto all'hero, che diventa pieno durante lo scorrimento:**
  - menu a schermo intero (Popover API) con voci numerate in Bodoni, immagine, indirizzo e CTA;
  - la logica è in CSS (`body:has([data-hero])`), così non serve JavaScript per il layout.
- **Home:**
  - hero con seta in parallasse, titolo che sale riga per riga e foto ad arco;
  - marquee e manifesto;
  - collage parallasse « L'art du regard » e sezione « Je suis Alessia » con filigrana;
  - prestazioni numerate con immagine che segue il cursore (solo desktop);
  - galleria con aperture a maschera, FAQ e « Venir au studio ».
- **Prestations e Galerie:** apertura scura comune (`PageHero`), elenco editoriale numerato a fisarmonica con « Réserver » per ogni prestazione, griglia sfalsata.
- **Footer:** invito finale, quattro colonne e "Lady A" gigante (SVG decorativo) che scorre in orizzontale.
- **Prenotazione, Mon espace, pagine legali:** restano su fondo sabbia, sobrie e senza animazioni decorative.

## Motore delle animazioni

`src/components/motion/` contiene:

- `boot-script.ts`, eseguito prima del primo rendering: aggiunge la classe `motion` solo se l'utente non ha chiesto di ridurre le animazioni; se il motore non parte entro 4 s, mostra tutto;
- `motion-provider.tsx`: GSAP, ScrollTrigger, SplitText e Lenis, caricati **dopo il `load`, quando il thread principale è libero**.

Le pagine restano server component e attivano le animazioni con attributi `data-reveal="lines|fade|mask"`, `data-parallax` e `data-parallax-x`.

## Verifiche (18/11/2026)

- **Lighthouse mobile:**

  | Pagina      | Performance                 | Accessibilità | Best practices | SEO |
  | ----------- | --------------------------- | ------------- | -------------- | --- |
  | Accueil     | 94–97 (varia tra le misure) | 100           | 100            | 100 |
  | Prestations | 96                          | 100           | 100            | 100 |
  | Galerie     | 96                          | 100           | 100            | 100 |
  | Réserver    | 95                          | 100           | 100            | 100 |

  L'LCP reale misurato (Moto G4, CPU ×4) è di 0,18 s: il titolo viene dipinto al primo frame.

- **Test E2E:**
  - i test funzionali girano con `reducedMotion: "reduce"`;
  - `tests/e2e/motion.spec.ts` verifica la versione animata: tutte le sezioni compaiono scorrendo e nulla resta nascosto con « réduire les animations ».
- **Screenshot e video di scorrimento:** `docs/screenshots/redesign/`.

## Pelliccia interattiva (18/11/2026)

Richiesta del committente: sulla prima schermata, passando il puntatore deve sembrare di toccare una pelliccia (« morbida, pelosa, tigrata »).

- **Come è fatta:** WebGL2, `src/components/home/fur-engine.ts`.
  - Circa 20–40 000 peli disegnati dalla scheda grafica in un'unica chiamata.
  - Il puntatore (o il dito) li pettina nella direzione del movimento e li apre un poco attorno alla punta. Il riflesso cambia con la direzione del pelo, come il velluto spazzolato al contrario.
  - Il pelo torna a posto lentamente.
- **Il manto:** rosette leopardate disegnate dallo shader sulla radice di ogni pelo, quindi con bordi morbidi come una pelliccia vera. È disponibile anche il manto tigrato (`pattern="tiger"`). È un effetto interattivo, non un'immagine generata.
- **Prestazioni:**
  - parte dopo il caricamento (non rallenta la prima visualizzazione);
  - da ferma disegna un solo fotogramma e poi si spegne, e torna attiva solo quando la si tocca;
  - sui dispositivi lenti riduce da sola il numero di peli;
  - senza scheda grafica vera (rendering software, robot come PageSpeed) non parte e l'hero resta tinta unita.
  - Per forzarla in prova: `/?fourrure`.
- **Accessibilità:**
  - con « riduci movimento » i peli non oscillano, ma rispondono comunque ai gesti del visitatore;
  - un velo scuro graduato mantiene leggibili titolo e pulsanti;
  - il canvas è nascosto ai lettori di schermo.
