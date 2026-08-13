/**
 * Pass-rate trend. Inline SVG rather than a chart library: it is four lines of
 * geometry, it renders on the server, and Recharts would ship 100kB to draw it.
 *
 * Always paired with the numeric pass rate beside it — never the only signal.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null

  const width = 72
  const height = 20
  const step = width / (values.length - 1)

  // Fixed 0–1 domain: an auto-scaled y-axis would make a wobble between 88% and
  // 90% look like a cliff.
  const points = values
    .map((value, index) => `${(index * step).toFixed(1)},${(height - value * height).toFixed(1)}`)
    .join(' ')

  const last = values[values.length - 1] ?? 0

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className="overflow-visible text-accent"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={width} cy={height - last * height} r="1.75" fill="currentColor" />
    </svg>
  )
}
