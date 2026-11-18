import Image from "next/image";
import Link from "next/link";

type Props = { name: string; logoUrl: string | null; size?: number };

/** Logo (replaceable from the admin) + typographic wordmark. */
export function Brand({ name, logoUrl, size = 40 }: Props) {
  return (
    <Link
      href="/"
      className="group flex min-h-11 min-w-0 items-center gap-2.5 sm:gap-3"
      aria-label={`${name} — accueil`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={size}
          height={size}
          className="size-9 shrink-0 rounded-[3px] ring-1 ring-caramel-300/40 sm:size-10"
          loading="eager"
        />
      ) : null}
      <span className="hidden font-display text-base leading-none tracking-wide whitespace-nowrap text-ivory transition-colors group-hover:text-caramel-300 min-[360px]:inline min-[400px]:text-lg sm:text-2xl">
        {name}
      </span>
    </Link>
  );
}
