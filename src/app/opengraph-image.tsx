import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getBusinessInfo } from "@/server/content/queries";

export const alt = "Lady A Beauty — lash maker & brow artist à Annemasse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literal paths keep file tracing scoped to these three files.
const [bodoni, jost, photo] = await Promise.all([
  readFile(
    join(
      process.cwd(),
      "src",
      "assets",
      "fonts",
      "BodoniModa-Display-Regular.ttf",
    ),
  ),
  readFile(join(process.cwd(), "src", "assets", "fonts", "Jost-Medium.ttf")),
  readFile(join(process.cwd(), "public", "galerie", "regard-01.jpg")),
]);
const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

export default async function OpenGraphImage() {
  const business = await getBusinessInfo();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#2b1a12",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
          width: 720,
        }}
      >
        <div
          style={{
            fontFamily: "Jost",
            fontSize: 22,
            letterSpacing: 6,
            color: "#d9ae7e",
          }}
        >
          ANNEMASSE · GENÈVE
        </div>
        <div
          style={{
            fontFamily: "Bodoni",
            fontSize: 84,
            color: "#fbf7f0",
            marginTop: 24,
            lineHeight: 1,
          }}
        >
          {business.name}
        </div>
        <div
          style={{
            fontFamily: "Jost",
            fontSize: 30,
            color: "#eadccb",
            marginTop: 28,
          }}
        >
          {business.tagline}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 480,
          height: 630,
        }}
      >
        <img
          src={photoSrc}
          alt=""
          width={480}
          height={630}
          style={{ objectFit: "cover" }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Bodoni", data: bodoni, style: "normal", weight: 400 },
        { name: "Jost", data: jost, style: "normal", weight: 500 },
      ],
    },
  );
}
