import clsx from "clsx";
import Image from "next/image";
import type { GalleryImage } from "@/server/content/queries";

type Props = { images: GalleryImage[]; layout?: "strip" | "grid" };

/**
 * "strip": horizontal scroll-snap row on phones, grid from tablet up (home).
 * "grid": responsive grid everywhere (gallery page).
 */
export function GalleryGrid({ images, layout = "grid" }: Props) {
  if (images.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-sand-200 p-10 text-center text-espresso-500">
        Les photos arrivent très bientôt.
      </p>
    );
  }

  return (
    <ul
      className={clsx(
        layout === "strip"
          ? "-mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0"
          : "grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3",
      )}
    >
      {images.map((img) => (
        <li
          key={img.id}
          className={clsx(
            layout === "strip" && "w-[72%] shrink-0 snap-center sm:w-auto",
          )}
        >
          <figure className="overflow-hidden rounded-card bg-espresso-900">
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes={
                layout === "strip"
                  ? "(min-width: 640px) 33vw, 72vw"
                  : "(min-width: 1024px) 33vw, 50vw"
              }
              className="aspect-[3/4] h-auto w-full object-cover"
            />
          </figure>
        </li>
      ))}
    </ul>
  );
}
