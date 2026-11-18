# Provenienza delle immagini

| Cartella | Contenuto | Origine e diritti |
|---|---|---|
| `public/galerie/` | Lavori di Alessia (6 foto) | Sito attuale di Alessia, ritagliate (`scripts/prepare-gallery.mts`). Di sua proprietà. |
| `public/editorial/regard-*-editorial.jpg` | Le stesse foto con leggero viraggio caldo | Solo colore e tono (`scripts/grade-photos.mts`), nessun ritocco del risultato. |
| `public/editorial/hero-*`, `soie-*`, `satin-*`, `bandeau-*` | Sete drappeggiate (espresso, leopardata, sabbia) | **Create per questo progetto** con uno shader WebGL (`scripts/textures/`). Opere originali: nessuna licenza di terzi, nessuna persona ritratta. |
| `public/patterns/leopard.svg` | Pattern leopardato | Originale (`scripts/generate-leopard.mts`). |

Regola: nessuna immagine di stock che mostri un viso, un occhio o un risultato viene presentata come lavoro di Alessia. Gli spazi fotografici del sito (hero, « À propos », collage) sono pronti per essere sostituiti con le foto dello shooting professionale.

Per rigenerare le texture: `node scripts/textures/render.mjs`.
