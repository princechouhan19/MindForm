import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, ChevronLeft, ChevronRight, Star, AlertTriangle, Download, Cloud, CloudOff, Loader } from 'lucide-react'
import { tasksAPI } from '../api/client'
import { useSync } from '../hooks/useSync'
import { DonutChart } from '../components/StatCard'

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEFAULT_TASKS = ['Wake up at 06:00', 'Gym 💪', 'Read 10 pages 📖', 'Work / Study 💻', 'Sleep by 11:00 PM 🌙']

function getWeekDays(year, month, weekNum) {
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const weekStart = (weekNum - 1) * 7 - startOffset
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month, weekStart + i + 1)
    days.push(d.getMonth() === month ? d.getDate() : null)
  }
  return days
}

function getWeeksInMonth(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7)
}

export default function TaskTracker() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [weekNum, setWeekNum] = useState(1)

  // All data keyed by weekKey
  const [allData, setAllData] = useState({})
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [newTask, setNewTask] = useState('')

  const monthKey = `${year}-${month}`
  const weekKey = `${monthKey}-w${weekNum}`
  const weekData = allData[weekKey] || {}
  const tasks = weekData.tasks || DEFAULT_TASKS
  const checks = weekData.checks || {}
  const reflection = weekData.reflection || {}

  // Load month data when month/year changes
  useEffect(() => {
    setLoadingWeek(true)
    tasksAPI.getMonth(monthKey)
      .then(res => {
        if (res.data) setAllData(prev => ({ ...prev, ...res.data }))
      })
      .catch(console.error)
      .finally(() => setLoadingWeek(false))
  }, [monthKey])

  // Current week payload for sync
  const syncPayload = useMemo(() => ({ tasks, checks, reflection }), [JSON.stringify({ tasks, checks, reflection })])

  const saveFn = useCallback(() => tasksAPI.upsertWeek(weekKey, syncPayload), [weekKey, JSON.stringify(syncPayload)])
  const syncStatus = useSync(saveFn, syncPayload)

  const totalWeeks = getWeeksInMonth(year, month)
  const weekDays = useMemo(() => getWeekDays(year, month, weekNum), [year, month, weekNum])

  const updateWeek = (patch) => {
    setAllData(prev => ({
      ...prev,
      [weekKey]: { ...prev[weekKey], ...patch }
    }))
  }

  const getChecked = (day, task) => checks[`${day}-${task}`] || false
  const setChecked = (day, task, val) => updateWeek({ checks: { ...checks, [`${day}-${task}`]: val } })

  const addTask = () => {
    if (!newTask.trim()) return
    updateWeek({ tasks: [...tasks, newTask.trim()] })
    setNewTask('')
  }

  const removeTask = (t) => updateWeek({ tasks: tasks.filter(x => x !== t) })
  const setRef = (field, val) => updateWeek({ reflection: { ...reflection, [field]: val } })

  const dayStats = weekDays.map((day, i) => {
    if (!day) return { label: SHORT_DAYS[i], completed: 0, total: 0, pct: 0 }
    const completed = tasks.filter(t => getChecked(day, t)).length
    const total = tasks.length
    return { label: SHORT_DAYS[i], completed, total, pct: total ? Math.round((completed / total) * 100) : 0, day }
  })

  const validDays = dayStats.filter(d => d.total > 0 && d.day)
  const bestDay = validDays.reduce((a, b) => a.pct >= b.pct ? a : b, validDays[0])
  const worstDay = validDays.reduce((a, b) => a.pct <= b.pct ? a : b, validDays[0])
  const totalCompleted = dayStats.reduce((s, d) => s + d.completed, 0)
  const totalGoal = dayStats.reduce((s, d) => s + d.total, 0)
  const weekScore = totalGoal ? Math.round((totalCompleted / totalGoal) * 100) : 0

  const weeklyBarData = Array.from({ length: totalWeeks }, (_, i) => {
    const wk = `${monthKey}-w${i + 1}`
    const wd = allData[wk] || {}
    const wTasks = wd.tasks || DEFAULT_TASKS
    const wDays = getWeekDays(year, month, i + 1)
    const wChecks = wd.checks || {}
    let done = 0, total = 0
    wDays.forEach(d => { if (d) wTasks.forEach(t => { total++; if (wChecks[`${d}-${t}`]) done++ }) })
    return { label: `Wk ${i + 1}`, pct: total ? Math.round((done / total) * 100) : 0 }
  })

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const exportCSV = () => {
    let csv = `Task Tracker - ${monthName} ${year} Week ${weekNum}\n\nTask,${SHORT_DAYS.map((d, i) => weekDays[i] ? `${d} ${weekDays[i]}` : d).join(',')}\n`
    tasks.forEach(t => { csv += `"${t}",${weekDays.map(d => d ? (getChecked(d, t) ? '✓' : '✗') : '-').join(',')}\n` })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `tasks-${year}-${month + 1}-w${weekNum}.csv`; a.click()
  }

  const SyncIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: syncStatus === 'error' ? 'var(--red)' : syncStatus === 'saving' ? 'var(--amber)' : syncStatus === 'saved' ? 'var(--green)' : 'var(--text-muted)' }}>
      {syncStatus === 'saving' ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : syncStatus === 'saved' ? <Cloud size={11} /> : syncStatus === 'error' ? <CloudOff size={11} /> : <Cloud size={11} />}
      {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'saved' ? 'Saved' : syncStatus === 'error' ? 'Sync failed' : ''}
    </div>
  )

  const tt = { background: '#13151d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>TASK TRACKER</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800 }}>{monthName} {year}</h1>
              <SyncIndicator />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button onClick={() => setWeekNum(w => Math.max(1, w - 1))} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', padding: '0 6px', minWidth: 60, textAlign: 'center' }}>Week {weekNum}</span>
              <button onClick={() => setWeekNum(w => Math.min(totalWeeks, w + 1))} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronRight size={18} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setWeekNum(1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronLeft size={18} /></button>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setWeekNum(1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}><ChevronRight size={18} /></button>
            </div>
            <button onClick={exportCSV} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 220px 220px', gap: 12, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / 3', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 10 }}>WEEKLY PROGRESS</div>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={weeklyBarData} barSize={20}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tt} formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="pct" fill="var(--cyan)" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>THIS WEEK INSIGHTS</div>
            {bestDay && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Star size={14} color="var(--amber)" fill="var(--amber)" /><div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Strongest</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>{bestDay.label} · {bestDay.pct}%</div></div></div>}
            {worstDay && worstDay.label !== bestDay?.label && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={14} color="var(--red)" /><div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Needs Focus</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{worstDay.label} · {worstDay.pct}%</div></div></div>}
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>WEEK SCORE</div>
            <DonutChart percent={weekScore} size={84} color={weekScore >= 80 ? 'var(--green)' : weekScore >= 50 ? 'var(--amber)' : 'var(--red)'} />
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>WEEK TOTALS</div>
            {[['Goal', totalGoal, 'var(--text-primary)'], ['Done', totalCompleted, 'var(--green)'], ['Left', totalGoal - totalCompleted, 'var(--red)']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 20px' }}>
        {loadingWeek ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 8 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading data...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
              {weekDays.map((day, i) => {
                const stats = dayStats[i]
                const isToday = day && new Date(year, month, day).toDateString() === today.toDateString()
                return (
                  <div key={i} style={{ background: isToday ? 'rgba(0,229,255,0.04)' : 'var(--bg-card)', border: `1px solid ${isToday ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '16px', opacity: day ? 1 : 0.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--cyan)' : 'var(--text-secondary)', letterSpacing: '0.08em' }}>{SHORT_DAYS[i]}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: isToday ? 'var(--cyan)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{day || '—'}</div>
                      </div>
                      <DonutChart percent={stats.pct} size={50} color={stats.pct >= 80 ? 'var(--green)' : stats.pct >= 50 ? 'var(--amber)' : 'var(--red)'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tasks.map(task => (
                        <label key={task} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: day ? 'pointer' : 'default', padding: '6px 0' }}>
                          <input type="checkbox" checked={day ? getChecked(day, task) : false} disabled={!day} onChange={e => day && setChecked(day, task, e.target.checked)} style={{ accentColor: 'var(--cyan)', width: 15, height: 15, cursor: 'pointer' }} />
                          <span style={{ fontSize: 13, color: day && getChecked(day, task) ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: day && getChecked(day, task) ? 'line-through' : 'none', lineHeight: 1.3, transition: 'all 0.15s' }}>{task}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>✓{stats.completed}</span>
                      <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>✗{stats.total - stats.completed}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 16 }}>MANAGE TASKS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {tasks.map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{t}</span>
                      <button onClick={() => removeTask(t)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add task..." style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }} />
                  <button onClick={addTask} style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, color: 'var(--cyan)', padding: '10px 16px', display: 'flex', alignItems: 'center' }}><Plus size={18} /></button>
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 16 }}>WEEKLY REFLECTION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[['win', '🏆 Best win this week?'], ['slow', '🐢 What slowed me down?'], ['focus', '🎯 One focus for next week']].map(([field, label]) => (
                    <div key={field}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                      <textarea value={reflection[field] || ''} onChange={e => setRef(field, e.target.value)} rows={2} style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-display)' }} />
                    </div>
                  ))}
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
