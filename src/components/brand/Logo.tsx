import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/format";

interface LogoProps {
  variant?: "white" | "black";
  className?: string;
  width?: number;
  href?: string;
  priority?: boolean;
}

/** Logo con tagline "Build to evolve". Proporción 1129 × 302. */
export function Logo({ variant = "black", className, width = 132, href = "/", priority }: LogoProps) {
  const img = (
    <Image
      src={variant === "white" ? "/brand/ryvox-logo-white.png" : "/brand/ryvox-logo-black.png"}
      alt="RYVOX · Build to evolve"
      width={width}
      height={Math.round(width * (302 / 1129))}
      priority={priority}
      className={cn("h-auto select-none", className)}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="RYVOX inicio" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}
