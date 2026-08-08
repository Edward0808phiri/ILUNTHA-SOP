import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------
   Chart tokens.

   Colours are validated, not eyeballed — the categorical slots below
   clear the lightness band, chroma floor, CVD separation (protan /
   deutan) and 3:1 contrast checks against a white card surface.

   INCOME  #0089B8  chroma-corrected step of the brand blue (#6AAEC8
                    itself reads gray: OKLCH C 0.079, and 2.41:1)
   EXPENSE #C47840  brand orange, passes as-is
   income↔expense   CVD ΔE 24.4 · normal-vision ΔE 24.4

   The app is light-only (no dark mode anywhere), so these commit to
   the light surface rather than carrying a second unused set.
------------------------------------------------------------------- */
export const VIZ = {
  surface:  '#FFFFFF',
  grid:     '#EDF2F6',
  zero:     '#CBD5E1',
  ink:      '#0F172A',
  muted:    '#64748B',
  faint:    '#94A3B8',
  income:   '#0089B8',
  expense:  '#C47840',
  positive: '#0089B8',
  negative: '#D64545',
  aqua:     '#1BAF7A',
};

const GAP = 2;          // surface gap between adjacent fills
const RADIUS = 4;       // rounded data-end

/* ---------------------------- helpers ---------------------------- */

export function money(cs: string, n: number) {
  return `${n < 0 ? '-' : ''}${cs}${Math.abs(n).toFixed(2)}`;
}

export function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 1_000)     return `${(n / 1_000).toFixed(a >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

function niceCeil(v: number) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function ticks(max: number, count = 4) {
  const top = niceCeil(max);
  return Array.from({ length: count + 1 }, (_, i) => (top / count) * i);
}

/** Rect with the two ends away from the baseline rounded. */
function capPath(x: number, y: number, w: number, h: number, dir: 'up' | 'down' | 'right') {
  const r = Math.max(0, Math.min(RADIUS, w / 2, h / 2, dir === 'right' ? w : h));
  if (h <= 0 || w <= 0) return '';
  if (dir === 'up')
    return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
  if (dir === 'down')
    return `M${x},${y} L${x},${y + h - r} Q${x},${y + h} ${x + r},${y + h} L${x + w - r},${y + h} Q${x + w},${y + h} ${x + w},${y + h - r} L${x + w},${y} Z`;
  return `M${x},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} Z`;
}

/** Width of a block, observed — labels need real pixels, not a stretched viewBox. */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ------------------------- shared chrome ------------------------- */

export function ChartCard({ title, hint, right, children }: {
  title: string; hint?: string; right?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
        {right && <div className="ml-auto shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {items.map(s => (
        <span key={s.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function TableToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition"
      style={on
        ? { background: '#D4EBF5', color: '#4E96B0', borderColor: '#D4EBF5' }
        : { background: 'white', color: '#94A3B8', borderColor: '#E2E8F0' }}
    >
      {on ? 'Chart' : 'Table'}
    </button>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[320px]">
        <thead>
          <tr className="text-slate-500 text-left uppercase tracking-wider border-b" style={{ borderColor: '#E2E8F0' }}>
            {head.map((h, i) => (
              <th key={h} className={`px-2 py-2 font-semibold ${i === 0 ? '' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-slate-50 last:border-0">
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-2 py-1.5 ${ci === 0 ? 'text-slate-600' : 'text-right text-slate-700 font-semibold'}`}
                  style={ci === 0 ? undefined : { fontVariantNumeric: 'tabular-nums' }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={head.length} className="px-2 py-6 text-center text-slate-300">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const W = 150;
  const left = Math.max(4, Math.min(x - W / 2, width - W - 4));
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 rounded-xl px-3 py-2 shadow-lg text-xs"
      style={{ left, width: W, background: 'white', border: '1px solid #E2E8F0' }}
    >
      {children}
    </div>
  );
}

export function EmptyPlot({ height, label }: { height: number; label: string }) {
  return (
    <div className="flex items-center justify-center text-xs text-slate-300" style={{ height }}>
      {label}
    </div>
  );
}

/* ----------------------- grouped bar chart ----------------------- */

export interface GroupPoint { key: string; label: string; full: string; values: number[] }

/**
 * Two (or more) series of the SAME unit on ONE axis — never a second y-scale.
 */
export function GroupedBars({ data, series, currency, height = 220 }: {
  data: GroupPoint[];
  series: { name: string; color: string }[];
  currency: string;
  height?: number;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const M = { top: 10, right: 8, bottom: 24, left: 46 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;

  const max = Math.max(1, ...data.flatMap(d => d.values));
  const scale = ticks(max);
  const top = scale[scale.length - 1];
  const y = (v: number) => M.top + plotH - (v / top) * plotH;

  const band = data.length ? plotW / data.length : 0;
  const inner = Math.max(4, band - Math.max(6, band * 0.3));
  const barW = Math.max(2, Math.min(20, (inner - GAP * (series.length - 1)) / series.length));
  const groupW = barW * series.length + GAP * (series.length - 1);

  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 54))));

  return (
    <div className="relative" ref={ref}>
      {width > 0 && (
        <svg width={width} height={height} role="img" style={{ display: 'block' }}>
          {scale.map(t => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
              <text x={M.left - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill={VIZ.faint} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {compact(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = M.left + band * i + band / 2;
            return (
              <g key={d.key}>
                {hover === i && (
                  <rect x={cx - band / 2} y={M.top} width={band} height={plotH} fill="#0F172A" opacity={0.04} rx={6} />
                )}
                {d.values.map((v, si) => {
                  const h = Math.max(v > 0 ? 2 : 0, (v / top) * plotH);
                  return (
                    <path
                      key={si}
                      d={capPath(cx - groupW / 2 + si * (barW + GAP), M.top + plotH - h, barW, h, 'up')}
                      fill={series[si].color}
                    />
                  );
                })}
              </g>
            );
          })}

          <line x1={M.left} x2={width - M.right} y1={M.top + plotH} y2={M.top + plotH} stroke={VIZ.zero} strokeWidth={1} />

          {data.map((d, i) => i % every === 0 && (
            <text key={d.key} x={M.left + band * i + band / 2} y={height - 8} textAnchor="middle" fontSize={10} fill={VIZ.faint}>
              {d.label}
            </text>
          ))}

          {/* hit areas — full-height bands, far bigger than the marks */}
          {data.map((d, i) => (
            <rect
              key={`hit-${d.key}`}
              x={M.left + band * i} y={M.top} width={Math.max(band, 1)} height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(h => (h === i ? null : h))}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <Tooltip x={M.left + band * hover + band / 2} width={width}>
          <p className="font-semibold text-slate-700 mb-1">{data[hover].full}</p>
          {series.map((s, si) => (
            <p key={s.name} className="flex items-center gap-1.5 text-slate-500 leading-5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
              {s.name}
              <span className="ml-auto font-semibold text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {money(currency, data[hover].values[si])}
              </span>
            </p>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/* -------------------- diverging bars (net) ----------------------- */

/** Polarity around a zero baseline: one hue up, one hue down, gray zero rule. */
export function DivergingBars({ data, currency, height = 160 }: {
  data: { key: string; label: string; full: string; value: number }[];
  currency: string;
  height?: number;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const M = { top: 10, right: 8, bottom: 24, left: 46 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;

  const max = Math.max(1, ...data.map(d => Math.abs(d.value)));
  const top = niceCeil(max);
  const zeroY = M.top + plotH / 2;
  const y = (v: number) => zeroY - (v / top) * (plotH / 2);

  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(20, band - Math.max(6, band * 0.3)));
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 54))));

  return (
    <div className="relative" ref={ref}>
      {width > 0 && (
        <svg width={width} height={height} role="img" style={{ display: 'block' }}>
          {[top, 0, -top].map(t => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.zero : VIZ.grid} strokeWidth={1} />
              <text x={M.left - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill={VIZ.faint} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {compact(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = M.left + band * i + band / 2;
            const h = Math.max(d.value !== 0 ? 2 : 0, (Math.abs(d.value) / top) * (plotH / 2));
            const up = d.value >= 0;
            return (
              <g key={d.key}>
                {hover === i && <rect x={cx - band / 2} y={M.top} width={band} height={plotH} fill="#0F172A" opacity={0.04} rx={6} />}
                <path
                  d={capPath(cx - barW / 2, up ? zeroY - h : zeroY, barW, h, up ? 'up' : 'down')}
                  fill={up ? VIZ.positive : VIZ.negative}
                />
              </g>
            );
          })}

          {data.map((d, i) => i % every === 0 && (
            <text key={d.key} x={M.left + band * i + band / 2} y={height - 8} textAnchor="middle" fontSize={10} fill={VIZ.faint}>
              {d.label}
            </text>
          ))}

          {data.map((d, i) => (
            <rect
              key={`hit-${d.key}`}
              x={M.left + band * i} y={M.top} width={Math.max(band, 1)} height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(h => (h === i ? null : h))}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <Tooltip x={M.left + band * hover + band / 2} width={width}>
          <p className="font-semibold text-slate-700 mb-1">{data[hover].full}</p>
          <p className="flex items-center gap-1.5 text-slate-500">
            Net
            <span
              className="ml-auto font-semibold"
              style={{ fontVariantNumeric: 'tabular-nums', color: data[hover].value >= 0 ? VIZ.positive : VIZ.negative }}
            >
              {money(currency, data[hover].value)}
            </span>
          </p>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------ horizontal bars ------------------------ */

/**
 * Nominal categories, one series → every bar takes the same hue.
 * Bar length already encodes magnitude; a value-ramp would re-encode it.
 */
export function HBars({ data, color, currency, max: rows = 8 }: {
  data: { label: string; value: number }[];
  color: string;
  currency: string;
  max?: number;
}) {
  const shown = data.slice(0, rows);
  const top = Math.max(1, ...shown.map(d => d.value));
  return (
    <div className="space-y-2.5">
      {shown.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-24 sm:w-32 shrink-0 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 min-w-0 h-4 relative">
            <svg width="100%" height="16" style={{ display: 'block' }}>
              <rect x={0} y={3} width="100%" height={10} rx={5} fill={VIZ.grid} />
              <rect x={0} y={3} width={`${(d.value / top) * 100}%`} height={10} rx={5} fill={color} />
            </svg>
          </div>
          <span
            className="text-xs font-bold text-slate-700 w-20 text-right shrink-0"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {currency}{d.value.toFixed(2)}
          </span>
        </div>
      ))}
      {shown.length === 0 && <p className="text-xs text-slate-300 py-6 text-center">No data</p>}
    </div>
  );
}

/* ----------------------------- donut ----------------------------- */

function arc(cx: number, cy: number, rO: number, rI: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(rO, a0), [x1, y1] = p(rO, a1);
  const [x2, y2] = p(rI, a1), [x3, y3] = p(rI, a0);
  return `M${x0},${y0} A${rO},${rO} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${rI},${rI} 0 ${large} 0 ${x3},${y3} Z`;
}

/**
 * Part-to-whole at a glance, ≤ 6 segments. Every segment is also
 * direct-labelled beside the ring — the aqua slot sits at 2.74:1 on
 * white and its pair with orange lands in the 6–8 CVD band, so the
 * visible labels are the required relief, not decoration.
 */
export function Donut({ data, currency, size = 132 }: {
  data: { label: string; value: number; color: string }[];
  currency: string;
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const rO = size / 2, rI = size / 2 - 18;
  const gapRad = data.length > 1 ? GAP / rO : 0;
  let a = -Math.PI / 2;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} className="shrink-0" role="img">
        {total === 0 ? (
          <circle cx={rO} cy={rO} r={(rO + rI) / 2} fill="none" stroke={VIZ.grid} strokeWidth={rO - rI} />
        ) : (
          data.map(d => {
            const sweep = (d.value / total) * Math.PI * 2;
            const a0 = a + gapRad / 2, a1 = a + sweep - gapRad / 2;
            a += sweep;
            if (a1 <= a0) return null;
            return <path key={d.label} d={arc(rO, rO, rO, rI, a0, a1)} fill={d.color} />;
          })
        )}
      </svg>
      <div className="space-y-2 min-w-0 flex-1" style={{ maxWidth: 340 }}>
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-slate-500 truncate">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-700 shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {currency}{d.value.toFixed(2)}
            </span>
            <span className="text-slate-400 w-10 text-right shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-slate-300">No payments recorded</p>}
      </div>
    </div>
  );
}
