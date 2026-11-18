import { FurLayer } from "./fur-layer";

/**
 * The snow-leopard coat behind every light page: fixed to the screen, so the
 * content glides over it. Dark sections cover it (and strokes there are left
 * to their own coat).
 */
export function PageCoat() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <FurLayer pattern="snow" veil="page" occludedBy=".surface-dark" />
    </div>
  );
}
