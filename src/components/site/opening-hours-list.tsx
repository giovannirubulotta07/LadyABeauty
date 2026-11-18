import clsx from "clsx";
import {
  groupLabel,
  groupWeek,
  type OpeningWindow,
} from "@/domain/schedule/opening-hours";

type Props = {
  hours: OpeningWindow[];
  tone?: "light" | "dark";
  className?: string;
};

export function OpeningHoursList({ hours, tone = "light", className }: Props) {
  const groups = groupWeek(hours);
  const muted = tone === "dark" ? "text-sand-100" : "text-espresso-500";

  return (
    <dl
      className={clsx(
        "divide-y",
        tone === "dark" ? "divide-sand-100/15" : "divide-sand-200",
        className,
      )}
    >
      {groups.map((group) => (
        <div
          key={group.from}
          className="flex items-baseline justify-between gap-6 py-3"
        >
          <dt>{groupLabel(group, { capitalize: true })}</dt>
          <dd
            className={clsx(
              "text-right tabular-nums",
              group.windows.length === 0 && muted,
            )}
          >
            {group.windows.length === 0
              ? "Fermé"
              : group.windows.map((w) => (
                  <span key={w.opens} className="block">
                    <time dateTime={w.opens}>{w.opens}</time> –{" "}
                    <time dateTime={w.closes}>{w.closes}</time>
                  </span>
                ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
