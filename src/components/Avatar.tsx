export function Avatar({
  name,
  color,
  size = 32,
  title,
}: {
  name: string;
  color: string;
  size?: number;
  title?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      title={title ?? name}
      aria-label={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white select-none"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  );
}
