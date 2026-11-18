import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  id?: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "start" | "center";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
};

/** Small tracked label + Didone title, the recurring section header. */
export function SectionHeading({
  id,
  label,
  title,
  intro,
  align = "start",
  tone = "light",
  as: Tag = "h2",
}: Props) {
  return (
    <header
      className={clsx(
        "max-w-prose",
        align === "center" && "mx-auto text-center",
      )}
    >
      <p
        className={clsx(
          "label",
          tone === "dark" ? "text-caramel-300" : "text-caramel-700",
        )}
      >
        {label}
      </p>
      <Tag
        id={id}
        className={clsx(
          "mt-4 text-title",
          tone === "dark" ? "text-ivory" : "text-espresso-900",
        )}
      >
        {title}
      </Tag>
      {intro ? (
        <div
          className={clsx(
            "mt-5 text-base leading-relaxed",
            tone === "dark" ? "text-sand-100" : "text-espresso-500",
          )}
        >
          {intro}
        </div>
      ) : null}
    </header>
  );
}
