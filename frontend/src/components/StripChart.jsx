const WIDTH = 600;
const HEIGHT = 180;
const FLOOR = 50;
const CEILING = 100;
const HIGH = 80;
const POINTS = 60;
const PAD = 8;

const y = (value) =>
  PAD + (1 - (value - FLOOR) / (CEILING - FLOOR)) * (HEIGHT - 2 * PAD);

/** Recorder-style trace: the newest reading sits on the right edge. */
export default function StripChart({ readings }) {
  const recent = readings.slice(0, POINTS).reverse();
  const step = WIDTH / (POINTS - 1);
  const offset = WIDTH - (recent.length - 1) * step;
  const coords = recent.map((r, i) => [offset + i * step, y(r.value), r]);
  const latest = recent.at(-1);

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          latest
            ? `Trace of the last ${recent.length} readings, latest ${latest.value}`
            : 'No readings yet'
        }
      >
        {[60, 70, 90].map((v) => (
          <line key={v} className="chart__grid" x1="0" x2={WIDTH} y1={y(v)} y2={y(v)} />
        ))}
        <line className="chart__threshold" x1="0" x2={WIDTH} y1={y(HIGH)} y2={y(HIGH)} />
        {coords.length > 1 && (
          <polyline className="chart__trace" points={coords.map(([px, py]) => `${px},${py}`).join(' ')} />
        )}
        {/* Zero-length round-capped lines stay circular under preserveAspectRatio="none". */}
        {coords.map(([px, py, r]) => (
          <line
            key={r.id}
            className={`chart__dot chart__dot--${r.severity}`}
            x1={px}
            x2={px}
            y1={py}
            y2={py}
          />
        ))}
      </svg>
      <figcaption>
        <span>Scale 50–100, last {POINTS} readings</span>
        <span className="chart__legend">Dashed line: high above 80</span>
      </figcaption>
    </figure>
  );
}
