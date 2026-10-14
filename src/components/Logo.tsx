import Image from "next/image";

/** Square ZDocs mark. */
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      className={`shrink-0 select-none ${className}`}
      aria-hidden
    />
  );
}

/** Full ZDocs wordmark (mark + text). */
export function Wordmark({ height = 32, className = "" }: { height?: number; className?: string }) {
  // Source image is 720x209.
  const width = Math.round(height * (720 / 209));
  return (
    <Image
      src="/logo.png"
      alt="ZDocs"
      width={width}
      height={height}
      priority
      className={`select-none ${className}`}
    />
  );
}
