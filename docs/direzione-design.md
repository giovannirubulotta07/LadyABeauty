# Nuova direzione visiva — riferimento ever.co.id

Richiesta del 18/11/2026: design lussuoso, solo foto di alta qualità, livello "agenzia specializzata in design e animazioni", ispirato a https://www.ever.co.id/.
Questa richiesta **sostituisce** due vincoli del brief iniziale: "una sola micro-animazione" e "leopardato solo in pochi punti" (il secondo resta valido nello spirito: niente leopardato dietro al testo).
Restano invariati: accessibilità AA, `prefers-reduced-motion`, mobile first, Lighthouse ≥ 95.

## Cosa rende ever.co.id "da agenzia" (analisi)

| Elemento | Come lo fa ever | Come lo traduco per Lady A Beauty |
|---|---|---|
| **Colore** | Un solo fondo pieno, marrone caldo (#7A6047), testo bianco ovunque: effetto cinematografico | Fondo **espresso/cammello** a tutta pagina e testo avorio; il sabbia resta per le sezioni "carta" (prenotazione, Mon espace). Il leopardato diventa una **texture fotografica** (tessuto) nelle composizioni, non un motivo grafico |
| **Tipografia** | Serif editoriale enorme (Bradford, 126 px) + sans light maiuscolo con molta aria (Maax Light 80 px) | Bodoni Moda per i titoli giganti (fino a 9–10 rem), **Jost Light maiuscolo** con interlinea ampia per i titoli secondari, etichette piccolissime spaziate |
| **Header** | Hamburger a sinistra, wordmark spaziato al centro, "Make an appointment" piccolo a destra; menu a schermo intero | Stessa struttura; menu a schermo intero con voci in Bodoni enorme e immagine che cambia al passaggio |
| **Hero** | Ritratto editoriale a tutto schermo (anche video), titolo serif sovrapposto, "scroll to explore" | Foto o video a tutto schermo, "Lady A Beauty" in serif gigante con apparizione riga per riga, indicazione di scorrimento |
| **Scroll storytelling** | GSAP ScrollTrigger: collage di texture che scorrono a velocità diverse (parallasse) attorno a un titolo; testo gigante semitrasparente dietro ai ritratti | Collage parallasse (texture: seta, leopardato, ciglia in macro) attorno a "L'ART DU REGARD"; "LADY A" gigante in filigrana dietro alla foto |
| **Movimento** | Lenis (scroll fluido), SplitType (testi che si rivelano riga per riga), maschere sulle immagini, marquee | Lenis + GSAP/ScrollTrigger + SplitText: titoli rivelati, immagini che si "aprono" con una maschera, marquee « Lash maker · Brow artist · Annemasse », numeri 01/02/03 sulle prestazioni |
| **Prestazioni** | Elenco numerato (001, 002…), immagine che appare al passaggio del mouse | Elenco editoriale numerato con durata e prezzo; su desktop l'immagine segue il cursore, su mobile card fotografiche |
| **Chiusura** | FAQ a fisarmonica, footer con wordmark gigante | FAQ (acconto, annullamento, remplissage entro 3 settimane…), footer con "LADY A" gigante e CTA prenotazione |

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
Le opzioni sono nella risposta in chat; la decisione spetta al committente.
