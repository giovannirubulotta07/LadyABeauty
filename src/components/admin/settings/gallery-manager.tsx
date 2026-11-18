"use client";

import Image from "next/image";
import { useState } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/admin/ui";
import {
  deleteGalleryImage,
  moveGalleryImage,
  updateGalleryImage,
} from "@/server/admin/actions/settings";
import { useAdminAction } from "../use-admin-action";

type Photo = {
  id: string;
  image_url: string;
  alt: string;
  width: number;
  height: number;
  is_published: boolean;
};

function AltEditor({ photo }: { photo: Photo }) {
  const { run, pending, error } = useAdminAction(updateGalleryImage);
  const [alt, setAlt] = useState(photo.alt);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        run({ id: photo.id, alt }, { onSuccess: () => setSaved(true) });
      }}
    >
      <label
        htmlFor={`alt-${photo.id}`}
        className="block text-sm text-espresso-700"
      >
        Description
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={`alt-${photo.id}`}
          value={alt}
          maxLength={300}
          onChange={(e) => {
            setAlt(e.target.value);
            setSaved(false);
          }}
          className="min-h-11 min-w-0 flex-1 rounded-control border border-espresso-500/60 bg-ivory px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending || alt === photo.alt}
          className="min-h-11 rounded-control border border-espresso-900/30 px-3 text-sm disabled:opacity-50"
        >
          {saved ? "✓" : "OK"}
        </button>
      </div>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </form>
  );
}

export function GalleryManager({ photos }: { photos: Photo[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, i) => (
        <li
          key={photo.id}
          className="rounded-card border border-sand-200 bg-ivory p-3"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-card)-2px)] bg-sand-100">
            <Image
              src={photo.image_url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
              className={
                photo.is_published ? "object-cover" : "object-cover opacity-50"
              }
            />
            <span className="absolute top-2 left-2">
              <Badge tone={photo.is_published ? "success" : "muted"}>
                {i + 1}
                {photo.is_published ? "" : " · masquée"}
              </Badge>
            </span>
          </div>
          <AltEditor photo={photo} />
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <ActionButton
              action={moveGalleryImage}
              input={{ id: photo.id, direction: "up" }}
              tone="quiet"
              ariaLabel={`Avancer la photo ${i + 1}`}
            >
              ↑
            </ActionButton>
            <ActionButton
              action={moveGalleryImage}
              input={{ id: photo.id, direction: "down" }}
              tone="quiet"
              ariaLabel={`Reculer la photo ${i + 1}`}
            >
              ↓
            </ActionButton>
            <ActionButton
              action={updateGalleryImage}
              input={{ id: photo.id, isPublished: !photo.is_published }}
              tone="quiet"
            >
              {photo.is_published ? "Masquer" : "Afficher"}
            </ActionButton>
            <ActionButton
              action={deleteGalleryImage}
              input={{ id: photo.id }}
              tone="quiet"
              confirm="Supprimer définitivement cette photo ?"
              ariaLabel={`Supprimer la photo ${i + 1}`}
            >
              Supprimer
            </ActionButton>
          </div>
        </li>
      ))}
    </ul>
  );
}
