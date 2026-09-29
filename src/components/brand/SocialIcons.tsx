import type { SVGProps } from "react";

const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.1 4.4 4.5 4.7" />
    </svg>
  );
}

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props} aria-hidden>
      <path d="M3.5 8.2A2.5 2.5 0 0 1 5.8 6c3.9-.3 8.5-.3 12.4 0a2.5 2.5 0 0 1 2.3 2.2c.3 2.4.3 5.2 0 7.6a2.5 2.5 0 0 1-2.3 2.2c-3.9.3-8.5.3-12.4 0a2.5 2.5 0 0 1-2.3-2.2c-.3-2.4-.3-5.2 0-7.6Z" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
