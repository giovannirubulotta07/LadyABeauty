import clsx from "clsx";
import { priceLabel } from "@/domain/catalog/price";
import { formatDuration, isoDuration } from "@/lib/format";
import type { Service } from "@/server/content/queries";
import { ClockIcon } from "@/components/ui/icons";

type Props = {
  service: Service;
  withDescription?: boolean;
  headingLevel?: "h2" | "h3";
};

export function ServiceCard({
  service,
  withDescription = false,
  headingLevel: Heading = "h3",
}: Props) {
  const price = priceLabel(service);
  const paragraphs = service.description.split(/\n{2,}/).filter(Boolean);

  return (
    <article
      id={service.slug}
      className="flex h-full scroll-mt-28 flex-col rounded-card bg-ivory p-6 shadow-card sm:p-7"
    >
      <Heading className="text-2xl leading-tight text-espresso-900">
        {service.name}
      </Heading>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-espresso-500">
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon width={16} height={16} />
          <time dateTime={isoDuration(service.durationMin)}>
            {formatDuration(service.durationMin)}
          </time>
        </span>
        {price ? (
          <>
            <span aria-hidden="true" className="text-caramel-500">
              ·
            </span>
            <span className="font-medium text-espresso-900">{price}</span>
          </>
        ) : null}
      </p>

      {service.variants.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {service.variants.map((v) => (
            <li
              key={v.id}
              className="rounded-pill border border-sand-200 px-3 py-1 text-xs text-espresso-700"
            >
              {v.name}
            </li>
          ))}
        </ul>
      ) : null}

      {withDescription && paragraphs.length > 0 ? (
        <div
          className={clsx(
            "mt-5 space-y-3 border-t border-sand-200 pt-5 text-sm leading-relaxed text-espresso-500",
          )}
        >
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
