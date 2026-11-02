import { cx } from "./ui";

/** A plate on a banana leaf — the app's mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx("size-9", className)} aria-hidden>
      <path d="M4 30C4 14 16 4 36 4c0 20-10 32-26 32-3.5 0-6-2.5-6-6Z" fill="var(--leaf)" />
      <path d="M8 32 30 10" stroke="var(--paper)" strokeOpacity=".35" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="21" cy="20" r="9.5" fill="var(--paper)" />
      <circle cx="21" cy="20" r="6.5" fill="var(--turmeric)" />
      <path d="m18 20 2.2 2.2 4.3-4.6" fill="none" stroke="#3d2a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, label }: { className?: string; label: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-xl font-bold text-ink">{label}</span>
    </span>
  );
}
