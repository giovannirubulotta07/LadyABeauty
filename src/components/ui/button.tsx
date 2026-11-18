import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "light" | "outline" | "outline-light";
type Size = "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-6 text-center font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-espresso-900 text-ivory hover:bg-caramel-700",
  light: "bg-ivory text-espresso-900 hover:bg-caramel-300",
  outline:
    "border border-espresso-900 text-espresso-900 hover:bg-espresso-900 hover:text-ivory",
  "outline-light":
    "border border-sand-100/60 text-ivory hover:border-caramel-300 hover:text-caramel-300",
};

const sizes: Record<Size, string> = {
  md: "py-3",
  lg: "min-h-13 px-8 py-4",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return clsx(base, variants[variant], sizes[size], className);
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props} />
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}
