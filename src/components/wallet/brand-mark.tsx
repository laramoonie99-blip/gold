import { cn } from "@/lib/utils";

// Generic wallet-neutral mark: two offset rounded chevrons forming a stylized
// "W" inside a soft-gradient tile. Scales via `className` width/height.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="bm-fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#bm-bg)" />
      <path
        d="M12 17.5c0-.9.6-1.5 1.5-1.5h21c.9 0 1.5.6 1.5 1.5v3H13.5A1.5 1.5 0 0 1 12 19v-1.5Z"
        fill="url(#bm-fg)"
        opacity="0.9"
      />
      <path
        d="M12 22h22c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H14a2 2 0 0 1-2-2v-10Z"
        fill="url(#bm-fg)"
      />
      <circle cx="31" cy="28" r="2.2" fill="#6d28d9" />
    </svg>
  );
}
