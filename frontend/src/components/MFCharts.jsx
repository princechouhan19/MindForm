import React, { useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area, YAxis, Cell } from 'recharts'

/* ═══════════════════════════════════════════════════════════════
   MFCharts — Apple Design System chart kit
   Modeled on Apple Health / Stocks / Fitness chart language:
   • Fully-rounded gradient bars (continuous-corner feel)
   • No gridlines, no axis lines — data speaks for itself
   • SF-style micro captions in secondary label color
   • Floating capsule tooltip with backdrop blur
   • iOS system colors, WCAG-AA contrast
═══════════════════════════════════════════════════════════════ */

/* ── Shared capsule tooltip (Apple Health style) ─────────────── */
export function MFCapsuleTooltip({ active, payload, label, unit = '%', color = 'var(--brand-primary)', seriesNames }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'var(--bg-overlay)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '9px 14px',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      pointerEvents: 'none',
    }}>
      {label !== undefined && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {seriesNames?.[p.dataKey] || p.name || p.dataKey}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
            {p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Apple Health-style bar chart ──────────────────────────────
   Rounded gradient bars; the max value is emphasized, others are
   softly muted — exactly how Health renders daily move data.     */
export function MFBarChart({
  data, height = 120, color = 'var(--brand-primary)', unit = '%',
  emphasizeMax = true, highlightIndex = null, showTicks = true, yMax = null,
}) {
  const [hover, setHover] = useState(null)
  const uid = React.useId().replace(/:/g, '')
  const gid = `mfb-${uid}`
  const maxVal = Math.max(...data.map(d => d.value), 0)
  const activeIdx = hover ?? highlightIndex

  const barColor = (i) => {
    if (activeIdx === i) return color
    if (emphasizeMax && data[i]?.value === maxVal && maxVal > 0) return color
    return `color-mix(in srgb, ${color} 38%, transparent)`
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barCategoryGap="28%" margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
          onMouseMove={s => setHover(s?.activeTooltipIndex ?? null)}
          onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={showTicks ? { fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 } : false}
            axisLine={false} tickLine={false} interval={0} />
          <YAxis hide domain={[0, yMax ?? 100]} />
          <Tooltip
            content={<MFCapsuleTooltip unit={unit} color={color} />}
            cursor={{ fill: 'var(--bg-glass)', radius: 8 }} />
          <Bar dataKey="value" radius={[5, 5, 5, 5]} maxBarSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill={activeIdx === i || data[i]?.value === maxVal ? `url(#${gid})` : barColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Apple Fitness-style activity ring ─────────────────────────
   Rounded line cap, subtle track, animated fill.                 */
export function MFRing({ percent, size = 80, stroke = 8, color = 'var(--brand-primary)', track = 'rgba(120,120,128,0.16)', label, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, Number(percent) || 0))
  const dash = (pct / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        {children ?? (
          <>
            <span style={{ fontSize: size > 70 ? 17 : 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {Math.round(pct)}%
            </span>
            {label && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{label}</span>}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Apple Stocks-style smooth area chart ────────────────────── */
export function MFAreaChart({
  data, series, height = 120, yDomain = null, showTicks = false, yTickCount = 3,
}) {
  // series: [{ key, name, color }]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`mfag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="label" tick={showTicks ? { fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 } : false}
          axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis
          hide={!showTicks}
          domain={yDomain ?? [0, 'auto']}
          tick={showTicks ? { fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 } : false}
          axisLine={false} tickLine={false} width={28} tickCount={yTickCount} />
        <Tooltip content={<MFCapsuleTooltip seriesNames={Object.fromEntries(series.map(s => [s.key, s.name]))} unit="" />} cursor={{ stroke: 'var(--border-bright)', strokeWidth: 1 }} />
        {series.map(s => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
            stroke={s.color} strokeWidth={2.5} fill={`url(#mfag-${s.key})`}
            dot={false} activeDot={{ r: 4, fill: s.color, stroke: 'var(--bg-base)', strokeWidth: 2 }}
            connectNulls />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Week strip — 7 segment bars (Tasks week view) ───────────── */
export function MFWeekStrip({ days, selected = null, onSelect }) {
  // days: [{ label, value, disabled }]
  const maxVal = Math.max(...days.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 84 }}>
      {days.map((d, i) => {
        const h = Math.max(6, Math.round((d.value / maxVal) * 100))
        const isSel = selected === i
        return (
          <button key={i} onClick={() => onSelect?.(i)} disabled={d.disabled}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: d.disabled ? 'default' : 'pointer', padding: 0,
              opacity: d.disabled ? 0.35 : 1,
            }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{d.value}%</span>
            <div style={{
              width: '100%', maxWidth: 30, height: h,
              minHeight: 6,
              borderRadius: 6,
              background: isSel
                ? 'var(--brand-primary)'
                : `color-mix(in srgb, var(--brand-primary) ${d.value > 0 ? 40 : 14}%, transparent)`,
              transition: 'background 0.2s, height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'var(--text-primary)' : 'var(--text-muted)' }}>{d.label}</span>
          </button>
        )
      })}
    </div>
  )
}

