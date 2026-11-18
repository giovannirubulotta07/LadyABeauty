"use client";

import { useRef, useState, useTransition } from "react";
import { Alert, Spinner } from "@/components/ui/form";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Photo upload that works with phone pictures: the image is shrunk in the
 * browser first (≤ 2400 px, JPEG) so large camera files upload quickly;
 * the server then makes the final WebP and strips metadata.
 */
export async function shrinkImage(file: File, max = 2400): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
        "image/jpeg",
        0.9,
      ),
    );
  } catch {
    return file; // HEIC on some browsers: let the server convert it.
  }
}

export function ImageUpload({
  action,
  label,
  hint,
  withAlt = false,
  multiple = false,
}: {
  action: (form: FormData) => Promise<Result>;
  label: string;
  hint?: string;
  withAlt?: boolean;
  multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const files = [...(input.current?.files ?? [])];
        if (!files.length) return setError("Choisissez une photo.");
        setError(undefined);
        setDone(undefined);
        startTransition(async () => {
          let count = 0;
          for (const file of files) {
            const form = new FormData();
            form.set("file", new File([await shrinkImage(file)], "photo.jpg"));
            form.set("alt", alt);
            const result = await action(form);
            if (!result.ok) return setError(result.error);
            count++;
          }
          setDone(
            count > 1 ? `${count} photos ajoutées.` : "Photo enregistrée.",
          );
          setAlt("");
          if (input.current) input.current.value = "";
        });
      }}
    >
      <div>
        <label
          htmlFor="upload-file"
          className="block text-sm font-medium text-espresso-900"
        >
          {label}
        </label>
        {hint ? <p className="mt-1 text-sm text-espresso-500">{hint}</p> : null}
        <input
          id="upload-file"
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple={multiple}
          required
          className="mt-2 block w-full text-sm text-espresso-700 file:mr-4 file:min-h-11 file:rounded-control file:border-0 file:bg-espresso-900 file:px-4 file:text-ivory"
        />
      </div>
      {withAlt ? (
        <div>
          <label
            htmlFor="upload-alt"
            className="block text-sm font-medium text-espresso-900"
          >
            Description de la photo
          </label>
          <p className="mt-1 text-sm text-espresso-500">
            Lue par les personnes malvoyantes et par Google. Ex. : « Extension
            de cils volume russe, effet naturel ».
          </p>
          <input
            id="upload-alt"
            value={alt}
            maxLength={300}
            onChange={(e) => setAlt(e.target.value)}
            className="mt-2 block min-h-12 w-full rounded-control border border-espresso-500/60 bg-ivory px-4"
          />
        </div>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {done ? <Alert tone="success">{done}</Alert> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-control bg-espresso-900 px-6 text-[0.8125rem] font-medium tracking-[0.16em] text-ivory uppercase hover:bg-caramel-700 disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
