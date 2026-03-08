import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Plus, Trash2, ChevronLeft, ChevronRight, Download, Trophy, Cloud, Loader, CheckCircle2, Circle, BarChart2 } from 'lucide-react'
import { habitsAPI } from '../api/client'
import { useSync } from '../hooks/useSync'
import { DonutChart } from '../components/StatCard'

const DEFAULT_HABITS = [
  { name: 'Wake up at 06:00', emoji: '⏰' },
  { name: 'Meditation', emoji: '🧘' },
  { name: 'GYM', emoji: '💪' },
  { name: 'Cold Shower', emoji: '🚿' },
  { name: 'Read 10 pages', emoji: '📖' },
  { name: 'No sugar', emoji: '🍬' },
  { name: 'Sleep before 11:00', emoji: '🌙' },
]

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate() }

function getWeekGroups(year, month) {
  const total = getDaysInMonth(year, month)
  const groups = []
  let week = 1, days = []
  for (let d = 1; d <= total; d++) {
    days.push(d)
    if (new Date(year, month, d).getDay() === 6 || d === total) {
      groups.push({ week, days: [...days] })
      week++; days = []
    }
  }
  return groups
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function HabitTracker() {
  const today = new Date()
  const isMobile = useIsMobile()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [loading, setLoading] = useState(false)

  const [habits, setHabits] = useState(DEFAULT_HABITS)
  const [checks, setChecks] = useState({})
  const [mental, setMental] = useState({})
  const [newHabit, setNewHabit] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [mobileTab, setMobileTab] = useState('today') // 'today' | 'stats' | 'manage'

  const monthKey = `${year}-${month}`
  const totalDays = getDaysInMonth(year, month)
  const weekGroups = useMemo(() => getWeekGroups(year, month), [year, month])
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  useEffect(() => {
    setLoading(true)
    habitsAPI.getMonth(monthKey)
      .then(res => {
        if (res.data) {
          if (res.data.habits?.length) setHabits(res.data.habits)
          setChecks(res.data.checks || {})
          setMental(res.data.mental || {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [monthKey])

  const syncPayload = useMemo(() => ({ habits, checks, mental }), [JSON.stringify({ habits, checks, mental })])
  const saveFn = useCallback(() => habitsAPI.upsertMonth(monthKey, syncPayload), [monthKey, JSON.stringify(syncPayload)])
  const syncStatus = useSync(saveFn, syncPayload)

  const isFutureDay = (day) => {
    const d = new Date(year, month, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d > t
  }
  const getChecked = (day, name) => checks[`${day}-${name}`] || false
  const toggleCheck = (day, name, val) => {
    if (isFutureDay(day)) return   // block future days
    setChecks(prev => ({ ...prev, [`${day}-${name}`]: val }))
  }
  const getMentalVal = (day, type) => mental[`${day}-${type}`] || ''
  const setMentalVal = (day, type, val) => {
    const num = Math.min(10, Math.max(1, parseInt(val) || 0))
    setMental(prev => ({ ...prev, [`${day}-${type}`]: num || '' }))
  }

  const habitStats = habits.map(h => {
    let done = 0
    for (let d = 1; d <= totalDays; d++) if (getChecked(d, h.name)) done++
    const pct = Math.round((done / totalDays) * 100)
    return { ...h, done, goal: totalDays, left: totalDays - done, pct }
  })

  const totalGoal = habits.length * totalDays
  const totalDone = habitStats.reduce((s, h) => s + h.done, 0)
  const overallPct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0

  // Today's completion
  const todayDone = habits.filter(h => getChecked(selectedDay, h.name)).length
  const todayPct = habits.length ? Math.round((todayDone / habits.length) * 100) : 0
  const todayColor = todayPct >= 80 ? 'var(--green)' : todayPct >= 50 ? 'var(--amber)' : 'var(--red)'

  const dailyData = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1
    const done = habits.filter(h => getChecked(d, h.name)).length
    return { label: d, pct: habits.length ? Math.round((done / habits.length) * 100) : 0 }
  })

  const weeklyData = weekGroups.map(wg => {
    const total = wg.days.length * habits.length
    const done = wg.days.reduce((s, d) => s + habits.filter(h => getChecked(d, h.name)).length, 0)
    return { label: `Wk ${wg.week}`, pct: total ? Math.round((done / total) * 100) : 0 }
  })

  const mentalData = Array.from({ length: totalDays }, (_, i) => ({
    label: i + 1,
    mood: getMentalVal(i + 1, 'mood') || null,
    motivation: getMentalVal(i + 1, 'motivation') || null,
  }))

  const addHabit = () => {
    if (!newHabit.trim()) return
    setHabits(prev => [...prev, { name: newHabit.trim(), emoji: newEmoji }])
    setNewHabit('')
  }
  const removeHabit = (name) => setHabits(prev => prev.filter(h => h.name !== name))

  const exportCSV = () => {
    let csv = `Habit Tracker - ${monthName} ${year}\n\nHabit,${Array.from({ length: totalDays }, (_, i) => i + 1).join(',')},Done,Goal,%\n`
    habitStats.forEach(h => { csv += `"${h.emoji} ${h.name}",${Array.from({ length: totalDays }, (_, i) => getChecked(i + 1, h.name) ? 1 : 0).join(',')},${h.done},${h.goal},${h.pct}%\n` })
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `habits-${year}-${month + 1}.csv`; a.click()
  }

  const tt = { background: '#13151d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }

  const SyncBadge = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: syncStatus === 'error' ? 'var(--red)' : syncStatus === 'saving' ? 'var(--amber)' : syncStatus === 'saved' ? 'var(--green)' : 'var(--text-muted)' }}>
      {syncStatus === 'saving' ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Cloud size={11} />}
      {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'saved' ? 'Saved' : syncStatus === 'error' ? 'Error' : ''}
    </div>
  )

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} } @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }`}</style>

        {/* Header */}
        <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px' }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 700 }}>{monthName.slice(0, 3)} {year}</span>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}><ChevronRight size={16} /></button>
            </div>
            <SyncBadge />
          </div>

          {/* Today's overview card */}
          <div style={{ background: `linear-gradient(135deg, var(--bg-card), ${todayColor}0a)`, border: `1px solid ${todayColor}33`, borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
                {selectedDay === today.getDate() && month === today.getMonth() ? "TODAY'S PROGRESS" : `DAY ${selectedDay} PROGRESS`}
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-mono)', color: todayColor, lineHeight: 1 }}>{todayPct}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{todayDone} / {habits.length} habits</div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ height: '100%', width: `${todayPct}%`, background: todayColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MONTH</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: overallPct >= 80 ? 'var(--green)' : overallPct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{overallPct}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{totalDone}/{totalGoal}</div>
            </div>
          </div>

          {/* Day strip */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', marginBottom: 2 }}>
            {Array.from({ length: totalDays }, (_, i) => {
              const d = i + 1
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSel = d === selectedDay
              const isFuture = isFutureDay(d)
              const done = habits.filter(h => getChecked(d, h.name)).length
              const pct = habits.length ? Math.round((done / habits.length) * 100) : 0
              const col = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : pct > 0 ? 'var(--red)' : null
              return (
                <button key={d} onClick={() => !isFuture && setSelectedDay(d)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 8px', borderRadius: 10, flexShrink: 0, cursor: isFuture ? 'not-allowed' : 'pointer', minWidth: 38,
                  background: isSel ? 'var(--amber-dim)' : 'var(--bg-card)',
                  border: `1px solid ${isSel ? 'var(--amber)' : isToday ? 'rgba(255,183,0,0.35)' : 'var(--border)'}`,
                  opacity: isFuture ? 0.4 : 1,
                }}>
                  <span style={{ fontSize: 8, color: isSel ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {isFuture ? '🔒' : ['S','M','T','W','T','F','S'][new Date(year, month, d).getDay()]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isSel ? 'var(--amber)' : isToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>{d}</span>
                  <div style={{ width: 16, height: 3, borderRadius: 2, background: col || 'var(--border)' }} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 14px' }}>
          {[['today', '✓ Habits'], ['stats', '📊 Stats'], ['manage', '⚙️ Manage']].map(([tab, label]) => (
            <button key={tab} onClick={() => setMobileTab(tab)} style={{
              flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600, background: 'none',
              color: mobileTab === tab ? 'var(--amber)' : 'var(--text-muted)',
              borderBottom: `2px solid ${mobileTab === tab ? 'var(--amber)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 8 }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading habits...
            </div>
          ) : mobileTab === 'today' && isFutureDay(selectedDay) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36 }}>🔒</div>
              <div style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>Future day<br /><span style={{ fontSize: 12 }}>You can only log habits for today or past days.</span></div>
            </div>
          ) : mobileTab === 'today' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.25s ease' }}>
              {habits.map((habit) => {
                const done = getChecked(selectedDay, habit.name)
                return (
                  <button
                    key={habit.name}
                    onClick={() => toggleCheck(selectedDay, habit.name, !done)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 18px', borderRadius: 14, cursor: 'pointer', width: '100%', textAlign: 'left',
                      background: done ? 'rgba(0,255,136,0.06)' : 'var(--bg-card)',
                      border: `1px solid ${done ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{habit.emoji}</span>
                    <span style={{
                      flex: 1, fontSize: 15, fontWeight: 500,
                      color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                      transition: 'all 0.2s',
                    }}>{habit.name}</span>
                    <div style={{ flexShrink: 0 }}>
                      {done
                        ? <CheckCircle2 size={24} color="var(--green)" />
                        : <Circle size={24} color="var(--border-bright)" />
                      }
                    </div>
                  </button>
                )
              })}
            </div>
          ) : mobileTab === 'stats' ? (
            <div style={{ animation: 'fadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Monthly bar chart */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>DAILY PROGRESS — {monthName}</div>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={dailyData} barSize={5}>
                    <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tt} formatter={v => [`${v}%`, 'Score']} labelFormatter={l => `Day ${l}`} />
                    <Bar dataKey="pct" fill="var(--amber)" radius={[2, 2, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Each habit progress */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 14 }}>HABIT LEADERBOARD</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...habitStats].sort((a, b) => b.pct - a.pct).map((h, i) => (
                    <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: i < 3 ? 'var(--amber)' : 'var(--text-muted)', minWidth: 18, textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ fontSize: 18 }}>{h.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{h.name}</span>
                          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{h.pct}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${h.pct}%`, background: h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood/Motivation inputs for selectedDay */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 14 }}>MENTAL STATE — Day {selectedDay}</div>
                {[['mood', '😊 Mood', 'var(--cyan)'], ['motivation', '🔥 Motivation', 'var(--amber)']].map(([type, label, color]) => (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{getMentalVal(selectedDay, type) || '—'}/10</span>
                    </div>
                    <input type="range" min={1} max={10} value={getMentalVal(selectedDay, type) || 0}
                      onChange={e => setMentalVal(selectedDay, type, e.target.value)}
                      style={{ width: '100%', accentColor: color.replace('var(', '').replace(')', '') === '--cyan' ? '#00e5ff' : '#ffb700', cursor: 'pointer' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>MY HABITS</div>
              {habits.map(h => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <span style={{ fontSize: 22 }}>{h.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{h.name}</span>
                  <button onClick={() => removeHabit(h.name)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 8, borderRadius: 8 }}
                    onTouchStart={e => e.currentTarget.style.color = 'var(--red)'}
                    onTouchEnd={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={16} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ width: 52, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 8px', fontSize: 18, color: 'var(--text-primary)', textAlign: 'center' }} placeholder="✨" />
                <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} placeholder="Add a habit..." style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }} />
                <button onClick={addHabit} style={{ background: 'var(--amber-dim)', border: '1px solid rgba(255,183,0,0.25)', borderRadius: 10, color: 'var(--amber)', padding: '12px 16px', display: 'flex', alignItems: 'center' }}><Plus size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── DESKTOP LAYOUT (Original, untouched) ──────────────────────────────────
  const top10 = [...habitStats].sort((a, b) => b.pct - a.pct).slice(0, 10)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>HABIT TRACKER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800 }}>{monthName} {year}</h1>
              <SyncBadge />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', minWidth: 90, textAlign: 'center' }}>{monthName.slice(0, 3)} {year}</span>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronRight size={18} /></button>
            </div>
            <button onClick={exportCSV} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--amber)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 160px 160px', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 10 }}>DAILY PROGRESS</div>
            <ResponsiveContainer width="100%" height={55}>
              <BarChart data={dailyData} barSize={4}>
                <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} formatter={v => [`${v}%`, 'Score']} labelFormatter={l => `Day ${l}`} />
                <Bar dataKey="pct" fill="var(--amber)" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 8 }}>WEEKLY PROGRESS</div>
            <ResponsiveContainer width="100%" height={55}>
              <BarChart data={weeklyData} barSize={24}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="pct" fill="var(--amber)" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {[['GOAL', habits.length * totalDays, 'var(--text-primary)'], ['DONE', totalDone, 'var(--green)'], ['LEFT', totalGoal - totalDone, 'var(--red)']].map(([l, v, c]) => (
            <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>{l}</div>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: c }}>{v}</div>
              <DonutChart percent={l === 'GOAL' ? 100 : l === 'DONE' ? overallPct : 100 - overallPct} size={36} color={c} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 8 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading habits...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 12 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2 }}>MY HABITS</th>
                        {weekGroups.map(wg => wg.days.map((d, di) => {
                          const isToday = new Date(year, month, d).toDateString() === today.toDateString()
                          const isFuture = isFutureDay(d)
                          return (
                            <th key={d} style={{ padding: '6px 4px', fontSize: 11, fontFamily: 'var(--font-mono)', color: isToday ? 'var(--amber)' : isFuture ? 'var(--text-muted)' : 'var(--text-muted)', borderBottom: '1px solid var(--border)', borderLeft: di === 0 && wg.week > 1 ? '1px solid rgba(255,183,0,0.15)' : 'none', minWidth: 32, textAlign: 'center', opacity: isFuture ? 0.4 : 1 }}>
                              {di === 0 && <div style={{ fontSize: 9, color: 'var(--amber)', marginBottom: 2 }}>W{wg.week}</div>}
                              {isFuture ? '🔒' : d}
                            </th>
                          )
                        }))}
                        <th style={{ padding: '12px 10px', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', minWidth: 44, textAlign: 'center' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habits.map((habit, hi) => {
                        const stats = habitStats[hi]
                        return (
                          <tr key={habit.name} style={{ background: hi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,183,0,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = hi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                            <td style={{ padding: '10px 16px', fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 220 }}>
                                <span>{habit.emoji} {habit.name}</span>
                                <button onClick={() => removeHabit(habit.name)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 2, flexShrink: 0 }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={14} /></button>
                              </div>
                            </td>
                            {weekGroups.map(wg => wg.days.map((d, di) => (
                              <td key={d} style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: di === 0 && wg.week > 1 ? '1px solid rgba(255,183,0,0.08)' : 'none', padding: '4px', opacity: isFutureDay(d) ? 0.35 : 1 }}>
                                <input type="checkbox" checked={getChecked(d, habit.name)} disabled={isFutureDay(d)} onChange={e => toggleCheck(d, habit.name, e.target.checked)} style={{ accentColor: 'var(--amber)', width: 15, height: 15, cursor: isFutureDay(d) ? 'not-allowed' : 'pointer' }} />
                              </td>
                            )))}
                            <td style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', padding: '10px 6px' }}>
                              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: stats.pct >= 80 ? 'var(--green)' : stats.pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{stats.pct}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                  <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ width: 44, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px', fontSize: 16, color: 'var(--text-primary)', textAlign: 'center' }} placeholder="✨" />
                  <input value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} placeholder="Add new habit..." style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }} />
                  <button onClick={addHabit} style={{ background: 'var(--amber-dim)', border: '1px solid rgba(255,183,0,0.2)', borderRadius: 8, color: 'var(--amber)', padding: '8px 18px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Trophy size={15} color="var(--amber)" />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>TOP HABITS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {top10.map((h, i) => (
                    <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: i < 3 ? 'var(--amber)' : 'var(--text-muted)', minWidth: 18, textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ fontSize: 12 }}>{h.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 4 }}>{h.name}</div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${h.pct}%`, background: h.pct >= 80 ? 'var(--green)' : h.pct >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>{h.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 10 }}>MENTAL STATE — MOOD & MOTIVATION (1–10)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={mentalData}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="motGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={tt} labelFormatter={l => `Day ${l}`} />
                    <Area type="monotone" dataKey="mood" stroke="var(--cyan)" strokeWidth={1.5} fill="url(#moodGrad)" dot={false} name="Mood" connectNulls />
                    <Area type="monotone" dataKey="motivation" stroke="var(--amber)" strokeWidth={1.5} fill="url(#motGrad)" dot={false} name="Motivation" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ overflowX: 'auto', maxWidth: 500 }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '3px 6px', color: 'var(--text-muted)', fontSize: 9, textAlign: 'left' }}></th>
                        {Array.from({ length: Math.min(14, totalDays) }, (_, i) => (
                          <th key={i + 1} style={{ padding: '3px 4px', color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)', textAlign: 'center', minWidth: 28 }}>{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[['mood', '😊', 'var(--cyan)'], ['motivation', '🔥', 'var(--amber)']].map(([type, emoji, color]) => (
                        <tr key={type}>
                          <td style={{ padding: '3px 6px', fontSize: 10 }}>{emoji}</td>
                          {Array.from({ length: Math.min(14, totalDays) }, (_, i) => (
                            <td key={i + 1} style={{ padding: '2px 2px' }}>
                              <input type="number" min={1} max={10} value={getMentalVal(i + 1, type)} onChange={e => setMentalVal(i + 1, type, e.target.value)}
                                style={{ width: 26, background: 'var(--bg-glass)', border: `1px solid ${getMentalVal(i + 1, type) ? color + '44' : 'var(--border)'}`, borderRadius: 4, padding: '3px 2px', fontSize: 9, color, fontFamily: 'var(--font-mono)', textAlign: 'center' }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Days 1–{Math.min(14, totalDays)} shown · hover chart for full month</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
