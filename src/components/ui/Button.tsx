import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-[transform,background-color,color,border-color,opacity] duration-300 ease-out-expo active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap select-none";

const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-graphite",
  secondary: "border border-black/15 bg-transparent text-black hover:border-black hover:bg-black hover:text-white",
  ghost: "text-black hover:bg-black/5",
  inverse: "bg-white text-black hover:bg-mist",
  danger: "bg-alert text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, "className" | "children">;
type LinkProps = BaseProps & { href: string } & Omit<ComponentProps<typeof Link>, "className" | "children" | "href">;

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, children, href, ...rest }: LinkProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}
