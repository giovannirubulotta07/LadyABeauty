"use client";

/**
 * Last-resort error page (replaces the root layout): self-contained styles,
 * since global CSS and fonts are not loaded here.
 */
export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#eadccb",
          color: "#16100c",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <title>Une erreur est survenue · Lady A Beauty</title>
        <main>
          <p
            style={{
              fontFamily: "Didot, 'Bodoni 72', Georgia, serif",
              fontSize: "2.25rem",
              margin: 0,
            }}
          >
            Lady A Beauty
          </p>
          <h1
            style={{
              fontWeight: 400,
              fontSize: "1.25rem",
              marginTop: "1.5rem",
            }}
          >
            Le site rencontre un problème momentané.
          </h1>
          <p style={{ color: "#614839" }}>
            Merci de réessayer dans quelques instants.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              minHeight: 44,
              padding: "0 1.5rem",
              border: 0,
              borderRadius: 4,
              background: "#2b1a12",
              color: "#fbf7f0",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
