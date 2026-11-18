import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Typographic monogram (Bodoni « A » on espresso) used for the favicon and
 * the home-screen icon. No image logo: the old « Lady A Cils » logo is retired.
 */
const bodoni = readFile(
  join(
    process.cwd(),
    "src",
    "assets",
    "fonts",
    "BodoniModa-Display-Regular.ttf",
  ),
);

export async function monogram(px: number, radius: number) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1f130d",
        borderRadius: radius,
        color: "#fbf7f0",
        fontFamily: "Bodoni",
        fontSize: px * 0.74,
        lineHeight: 1,
        paddingTop: px * 0.06,
      }}
    >
      A
    </div>,
    {
      width: px,
      height: px,
      fonts: [{ name: "Bodoni", data: await bodoni, weight: 400 }],
    },
  );
}
