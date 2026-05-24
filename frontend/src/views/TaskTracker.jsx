import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Plus, Trash2, ChevronLeft, ChevronRight, Star, AlertTriangle, Download, Cloud, CloudOff, Loader, Copy, CheckCircle2, Circle, Pencil, Check, X, Clock, Zap } from 'lucide-react'
import { tasksAPI } from '../api/client'
import { useSync } from '../hooks/useSync'
import { DonutChart } from '../components/StatCard'

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEFAULT_TASKS = [
  'Wake up at 06:00|06:00',
  'Gym 💪|08:00',
  'Read 10 pages 📖|12:00',
  'Work / Study 💻|14:00',
  'Sleep by 11:00 PM 🌙|23:00'
]

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

function getCurrentWeekNum(year, month) {
  const today = new Date()
  if (today.getFullYear() !== year || today.getMonth() !== month) return 1
  const totalWeeks = getWeeksInMonth(year, month)
  for (let w = 1; w <= totalWeeks; w++) {
    const days = getWeekDays(year, month, w).filter(Boolean)
    if (days.includes(today.getDate())) return w
  }
  return 1
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

// Custom Shadcn UI styled tooltip content
const ShadcnTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(10,11,15,0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{label}</div>
        {payload.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Score:</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.value}%</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function TaskTracker() {
  const today = new Date()
  const isMobile = useIsMobile()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [weekNum, setWeekNum] = useState(() => getCurrentWeekNum(today.getFullYear(), today.getMonth()))
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [mobileTab, setMobileTab] = useState('tasks') // 'tasks' | 'manage' | 'reflect'

  // All data keyed by weekKey
  const [allData, setAllData] = useState({})
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newTime, setNewTime] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [editText, setEditText] = useState('')
  const [editTime, setEditTime] = useState('')

  // Notifications and live countdown state
  const [toasts, setToasts] = useState([])
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const [triggeredToday, setTriggeredToday] = useState([])
  const [nextTaskInfo, setNextTaskInfo] = useState(null)

  const monthKey = `${year}-${month}`
  const weekKey = `${monthKey}-w${weekNum}`
  const weekData = allData[weekKey] || {}
  const tasks = weekData.tasks || DEFAULT_TASKS
  const checks = weekData.checks || {}
  const reflection = weekData.reflection || {}

  // Request native permission
  const requestNotificationAccess = async () => {
    if (!('Notification' in window)) return
    try {
      const res = await Notification.requestPermission()
      setNotifPermission(res)
    } catch (err) {
      console.warn("Failed to request notification permission:", err)
    }
  }

  // Parse task helper
  const parseTask = useCallback((t, idx) => {
    if (!t) return { id: `task-${idx}`, name: '', time: '' }
    if (t.includes('|')) {
      const parts = t.split('|')
      const name = parts[0]
      const time = parts.slice(1).join('|')
      return { id: `task-${idx}-${name}`, name, time }
    }
    const timeMatch = t.match(/\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b/)
    const time = timeMatch ? timeMatch[0] : ''
    return { id: `task-${idx}-${t}`, name: t, time }
  }, [])

  // Encode task helper
  const encodeTask = useCallback((taskObj) => {
    return `${taskObj.name}|${taskObj.time}`
  }, [])

  // Parsed tasks list
  const parsedTasks = useMemo(() => {
    return tasks.map((t, idx) => parseTask(t, idx))
  }, [tasks, parseTask])

  useEffect(() => {
    setLoadingWeek(true)
    tasksAPI.getMonth(monthKey)
      .then(res => { if (res.data) setAllData(prev => ({ ...prev, ...res.data })) })
      .catch(console.error)
      .finally(() => setLoadingWeek(false))
  }, [monthKey])

  const syncPayload = useMemo(() => ({ tasks, checks, reflection }), [JSON.stringify({ tasks, checks, reflection })])
  const saveFn = useCallback(() => tasksAPI.upsertWeek(weekKey, syncPayload), [weekKey, JSON.stringify(syncPayload)])
  const syncStatus = useSync(saveFn, syncPayload)

  const totalWeeks = getWeeksInMonth(year, month)
  const weekDays = useMemo(() => getWeekDays(year, month, weekNum), [year, month, weekNum])

  const updateWeek = (patch) => setAllData(prev => ({ ...prev, [weekKey]: { ...prev[weekKey], ...patch } }))
  const getChecked = (day, taskName) => checks[`${day}-${taskName}`] || false
  const isFutureDay = (day) => {
    const d = new Date(year, month, day)
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d > t
  }
  const setChecked = (day, taskName, val) => {
    if (isFutureDay(day)) return
    updateWeek({ checks: { ...checks, [`${day}-${taskName}`]: val } })
  }
  const addTask = () => {
    if (!newTask.trim()) return
    const encoded = encodeTask({ name: newTask.trim(), time: newTime })
    updateWeek({ tasks: [...tasks, encoded] })
    setNewTask('')
    setNewTime('')
  }
  const removeTask = (taskObj) => {
    const encoded = encodeTask(taskObj)
    updateWeek({
      tasks: tasks.filter(x => {
        if (x === encoded) return false
        const parsed = parseTask(x)
        return parsed.name !== taskObj.name
      })
    })
  }

  const handleSaveRename = (oldName) => {
    if (!editText.trim()) {
      setEditingTask(null)
      return
    }
    const trimmed = editText.trim()
    const encodedNew = encodeTask({ name: trimmed, time: editTime })
    const duplicate = parsedTasks.some(pt => pt.name.toLowerCase() === trimmed.toLowerCase() && pt.name.toLowerCase() !== oldName.toLowerCase())
    if (duplicate) {
      alert("A task with this name already exists in this week.")
      return
    }
    const newTasks = tasks.map(t => {
      const parsed = parseTask(t)
      if (parsed.name === oldName) {
        return encodedNew
      }
      return t
    })
    const newChecks = {}
    Object.entries(checks).forEach(([k, v]) => {
      const parts = k.split('-')
      const day = parts[0]
      const taskName = parts.slice(1).join('-')
      if (taskName === oldName) {
        newChecks[`${day}-${trimmed}`] = v
      } else {
        newChecks[k] = v
      }
    })
    updateWeek({ tasks: newTasks, checks: newChecks })
    setEditingTask(null)
  }

  const copyFromLastWeek = () => {
    if (weekNum <= 1) return
    const prevTasks = (allData[`${monthKey}-w${weekNum - 1}`] || {}).tasks || DEFAULT_TASKS
    const hasCustom = JSON.stringify(tasks) !== JSON.stringify(DEFAULT_TASKS)
    if (hasCustom && !confirm(`Replace Week ${weekNum} tasks with Week ${weekNum - 1} tasks?`)) return
    updateWeek({ tasks: [...prevTasks] })
  }
  const setRef = (field, val) => updateWeek({ reflection: { ...reflection, [field]: val } })

  const dayStats = weekDays.map((day, i) => {
    if (!day) return { label: SHORT_DAYS[i], completed: 0, total: 0, pct: 0 }
    const completed = parsedTasks.filter(t => getChecked(day, t.name)).length
    const total = parsedTasks.length
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
    wDays.forEach(d => {
      if (d) wTasks.forEach((t, idx) => {
        total++
        const parsed = parseTask(t, idx)
        if (wChecks[`${d}-${parsed.name}`]) done++
      })
    })
    return { label: `Wk ${i + 1}`, pct: total ? Math.round((done / total) * 100) : 0 }
  })

  // Play beautiful high-fidelity sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const playChimeNode = (freq, start, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + duration)
      }
      playChimeNode(1046.50, 0, 0.45) // C6 note
      playChimeNode(1567.98, 0.14, 0.55) // G6 note
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by security policies", e)
    }
  }

  // Timer: Check every 5 seconds for due tasks today
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      if (now.getFullYear() !== year || now.getMonth() !== month) return
      
      const currentDay = now.getDate()
      const hrs = String(now.getHours()).padStart(2, '0')
      const mins = String(now.getMinutes()).padStart(2, '0')
      const timeStr = `${hrs}:${mins}`

      parsedTasks.forEach(task => {
        if (!task.time) return
        if (task.time === timeStr) {
          const triggerKey = `${currentDay}-${task.name}-${timeStr}`
          if (!triggeredToday.includes(triggerKey)) {
            const isCompleted = getChecked(currentDay, task.name)
            if (!isCompleted) {
              setTriggeredToday(prev => [...prev, triggerKey])
              
              // Trigger local in-app Toast
              setToasts(prev => [
                ...prev,
                { id: Date.now(), title: "Task Time! 🔔", desc: task.name, time: task.time }
              ])

              // Play chime
              playNotificationSound()

              // Trigger native browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Task Due: ${task.name}`, {
                  body: `It's ${task.time}! Time to finish: ${task.name}`,
                  icon: '/logo.png',
                  requireInteraction: true
                })
              }
            }
          }
        }
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [parsedTasks, triggeredToday, checks, year, month])

  // Timer: Live countdown countdown string updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hrs = now.getHours()
      const mins = now.getMinutes()
      const secs = now.getSeconds()
      const totalSecsToday = hrs * 3600 + mins * 60 + secs

      // Active day checks
      const todayTasksWithTime = parsedTasks.filter(task => {
        if (!task.time) return false
        const isCompleted = getChecked(now.getDate(), task.name)
        if (isCompleted) return false
        return true
      })

      const tasksWithSeconds = todayTasksWithTime.map(task => {
        const parts = task.time.split(':')
        const tHrs = parseInt(parts[0]) || 0
        const tMins = parseInt(parts[1]) || 0
        const tSecs = tHrs * 3600 + tMins * 60
        return { task, secsFromMidnight: tSecs }
      })

      const futureTasks = tasksWithSeconds.filter(t => t.secsFromMidnight > totalSecsToday)

      if (futureTasks.length === 0) {
        setNextTaskInfo(null)
        return
      }

      futureTasks.sort((a, b) => a.secsFromMidnight - b.secsFromMidnight)
      const nextOne = futureTasks[0]
      const diffSecs = nextOne.secsFromMidnight - totalSecsToday

      const diffHrs = Math.floor(diffSecs / 3600)
      const diffMins = Math.floor((diffSecs % 3600) / 60)
      const diffSec = diffSecs % 60

      setNextTaskInfo({
        task: nextOne.task,
        countdownStr: `${String(diffHrs).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m ${String(diffSec).padStart(2, '0')}s`
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [parsedTasks, checks])

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const SyncIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: syncStatus === 'error' ? 'var(--red)' : syncStatus === 'saving' ? 'var(--amber)' : syncStatus === 'saved' ? 'var(--green)' : 'var(--text-muted)' }}>
      {syncStatus === 'saving' ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Cloud size={11} />}
      {syncStatus === 'saving' ? 'Saving...' : syncStatus === 'saved' ? 'Saved' : syncStatus === 'error' ? 'Error' : ''}
    </div>
  )

  // ─── Mobile Layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    const selIdx = weekDays.findIndex(d => d === selectedDay)
    const selStats = selIdx >= 0 ? dayStats[selIdx] : null
    const scoreColor = selStats ? (selStats.pct >= 80 ? 'var(--green)' : selStats.pct >= 50 ? 'var(--amber)' : 'var(--red)') : 'var(--text-muted)'

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} } @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

        {/* Mobile Header */}
        <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px' }}>
              <button onClick={() => setWeekNum(w => Math.max(1, w - 1))} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700 }}>Week {weekNum}</span>
              <button onClick={() => setWeekNum(w => Math.min(totalWeeks, w + 1))} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', padding: 2 }}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{monthName.slice(0, 3)} {year}</span>
              <SyncIndicator />
            </div>
          </div>

          {/* Upcoming Live Timer banner */}
          {nextTaskInfo && (
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-card), rgba(0,229,255,0.03))',
              border: '1px solid rgba(0,229,255,0.15)', borderRadius: 12, padding: '12px 14px',
              marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'fadeUp 0.3s ease'
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>UPCOMING IN {nextTaskInfo.countdownStr}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {nextTaskInfo.task.name} ({nextTaskInfo.task.time})
                </div>
              </div>
              <button onClick={requestNotificationAccess} style={{
                background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: 8, padding: '6px 12px', fontSize: 11, color: 'var(--cyan)', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
              }}>
                🔔 {notifPermission === 'granted' ? 'Active' : 'Allow'}
              </button>
            </div>
          )}

          {/* Week score mini bar + stat */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>WEEK SCORE</span>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: weekScore >= 80 ? 'var(--green)' : weekScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>{weekScore}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${weekScore}%`, background: weekScore >= 80 ? 'var(--green)' : weekScore >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <div><span style={{ color: 'var(--green)' }}>✓{totalCompleted}</span></div>
              <div><span style={{ color: 'var(--red)' }}>✗{totalGoal - totalCompleted}</span></div>
            </div>
          </div>

          {/* Day pill selector */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', marginBottom: 2 }}>
            {weekDays.map((day, i) => {
              if (!day) return null
              const isToday = new Date(year, month, day).toDateString() === today.toDateString()
              const isSel = day === selectedDay
              const pct = dayStats[i]?.pct || 0
              const col = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : pct > 0 ? 'var(--red)' : 'var(--text-muted)'
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 10px', borderRadius: 12, flexShrink: 0, cursor: 'pointer',
                    background: isSel ? 'var(--cyan-dim)' : 'var(--bg-card)',
                    border: `1px solid ${isSel ? 'var(--cyan)' : isToday ? 'var(--brand-primary-glow)' : 'var(--border)'}`,
                    transition: 'all 0.15s', minWidth: 42,
                  }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: isSel ? 'var(--cyan)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>{SHORT_DAYS[i]}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isSel ? 'var(--cyan)' : isToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>{day}</span>
                  {pct > 0 && <div style={{ width: 20, height: 3, borderRadius: 2, background: col }} />}
                  {pct === 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile Tab bar (Tasks / Manage / Reflect) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 14px' }}>
          {[['tasks', 'Today\'s Tasks'], ['manage', 'Manage'], ['reflect', 'Reflect']].map(([tab, label]) => (
            <button key={tab} onClick={() => setMobileTab(tab)} style={{
              flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600, background: 'none',
              color: mobileTab === tab ? 'var(--cyan)' : 'var(--text-muted)',
              borderBottom: `2px solid ${mobileTab === tab ? 'var(--cyan)' : 'transparent'}`,
              transition: 'all 0.15s', letterSpacing: '0.05em',
            }}>{label}</button>
          ))}
        </div>

        {/* Mobile Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px 80px' }}>
          {loadingWeek ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', gap: 8 }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </div>
          ) : mobileTab === 'tasks' ? (
            <div style={{ animation: 'fadeUp 0.25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{SHORT_DAYS[weekDays.indexOf(selectedDay)]}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', lineHeight: 1.1 }}>{selectedDay} {monthName.slice(0, 3)}</div>
                </div>
                {selStats && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-mono)', color: scoreColor, lineHeight: 1 }}>{selStats.pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{selStats.completed}/{selStats.total} done</div>
                  </div>
                )}
              </div>

              {/* Task cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsedTasks.map(task => {
                  const done = getChecked(selectedDay, task.name)
                  return (
                    <label key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      background: done ? 'rgba(0,255,136,0.05)' : 'var(--bg-card)',
                      border: `1px solid ${done ? 'rgba(0,255,136,0.25)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                      <input type="checkbox" checked={done}
                        onChange={e => setChecked(selectedDay, task.name, e.target.checked)}
                        style={{ display: 'none' }} />
                      <div style={{ flexShrink: 0 }}>
                        {done
                          ? <CheckCircle2 size={22} color="var(--green)" fill="rgba(0,255,136,0.15)" />
                          : <Circle size={22} color="var(--border-bright)" />
                        }
                      </div>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                        <span style={{
                          fontSize: 15, fontWeight: 500,
                          color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: done ? 'line-through' : 'none',
                          lineHeight: 1.4, transition: 'all 0.2s',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{task.name}</span>
                        {task.time && (
                          <span style={{
                            fontSize: 11, background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)',
                            borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-mono)', flexShrink: 0
                          }}>{task.time}</span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : mobileTab === 'manage' ? (
            <div style={{ animation: 'fadeUp 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>TASKS THIS WEEK</span>
                {weekNum > 1 && (
                  <button onClick={copyFromLastWeek} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--cyan)', background: 'var(--cyan-dim)', border: '1px solid var(--brand-primary-glow)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
                    <Copy size={11} /> Copy Wk {weekNum - 1}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {parsedTasks.map((t) => {
                  const isEditing = editingTask === t.name
                  return (
                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 12, border: isEditing ? '1px solid var(--cyan)' : '1px solid var(--border)' }}>
                      {isEditing ? (
                        <>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveRename(t.name)}
                              style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 14 }}
                              autoFocus
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={e => setEditTime(e.target.value)}
                              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                            <button onClick={() => handleSaveRename(t.name)} style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={13} /> Save
                            </button>
                            <button onClick={() => setEditingTask(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '4px 12px', fontSize: 12 }}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          {t.time && <span style={{ fontSize: 11, background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>{t.time}</span>}
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            <button onClick={() => { setEditingTask(t.name); setEditText(t.name); setEditTime(t.time) }} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 6 }}><Pencil size={15} /></button>
                            <button onClick={() => removeTask(t)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 6 }}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="Add task..." style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)' }} />
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 8px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                </div>
                <button onClick={addTask} style={{ background: 'var(--cyan-dim)', border: '1px solid var(--brand-primary-glow)', borderRadius: 10, color: 'var(--cyan)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}>
                  <Plus size={18} /> Add Task
                </button>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['win', '🏆', 'Best win this week?'], ['slow', '🐢', 'What slowed me down?'], ['focus', '🎯', 'Focus for next week']].map(([field, emoji, label]) => (
                <div key={field} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>{emoji} {label}</div>
                  <textarea value={reflection[field] || ''} onChange={e => setRef(field, e.target.value)} rows={3}
                    style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', resize: 'none', lineHeight: 1.5, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating In-App Toast Notifications */}
        <div style={{ position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: 'rgba(19,21,29,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(0,229,255,0.1)', borderRadius: 12, padding: '14px 16px',
              pointerEvents: 'auto', animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={18} color="var(--cyan)" fill="var(--cyan)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Scheduled for {t.time}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setChecked(new Date().getDate(), t.desc, true); setToasts(prev => prev.filter(x => x.id !== t.id)) }} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={14} /></button>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--border)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Desktop Layout ──────────────────────────────────────────────────────────
  const exportCSV = () => {
    let csv = `Task Tracker - ${monthName} ${year} Week ${weekNum}\n\nTask,${SHORT_DAYS.map((d, i) => weekDays[i] ? `${d} ${weekDays[i]}` : d).join(',')}\n`
    parsedTasks.forEach(t => { csv += `"${t.name}",${weekDays.map(d => d ? (getChecked(d, t.name) ? '✓' : '✗') : '-').join(',')}\n` })
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tasks-${year}-${month + 1}-w${weekNum}.csv`; a.click()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
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
              <button onClick={() => setWeekNum(w => Math.max(1, w - 1))} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', padding: '0 6px', minWidth: 60, textAlign: 'center' }}>Week {weekNum}</span>
              <button onClick={() => setWeekNum(w => Math.min(totalWeeks, w + 1))} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex', cursor: 'pointer' }}><ChevronRight size={18} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 12px' }}>
              <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setWeekNum(1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
              <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setWeekNum(1) }} style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px', display: 'flex', cursor: 'pointer' }}><ChevronRight size={18} /></button>
            </div>
            <button onClick={exportCSV} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12, marginBottom: 20 }}>
          {/* Weekly Progress — spans 2 cols */}
          <div style={{ gridColumn: 'span 2', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 10 }}>WEEKLY PROGRESS</div>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={weeklyBarData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ShadcnTooltip />} cursor={{ fill: 'rgba(0, 229, 255, 0.04)' }} />
                <Bar dataKey="pct" fill="var(--cyan)" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Live Countdown Timer Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-card), rgba(0,229,255,0.04))',
            border: '1px solid rgba(0,229,255,0.2)', borderRadius: 'var(--radius-md)', padding: '16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0,
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,229,255,0.03)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>NEXT TASK TIMER</span>
              <button onClick={requestNotificationAccess} style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2,
                color: notifPermission === 'granted' ? 'var(--green)' : 'var(--text-muted)'
              }} title={notifPermission === 'granted' ? "Notifications Enabled" : "Enable Notifications"}>
                <Star size={13} fill={notifPermission === 'granted' ? 'var(--green)' : 'none'} />
              </button>
            </div>
            {nextTaskInfo ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginTop: 8, letterSpacing: '-0.5px' }}>
                  {nextTaskInfo.countdownStr}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
                  🔔 {nextTaskInfo.task.name} at {nextTaskInfo.task.time}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)', marginTop: 12 }}>
                  No upcoming tasks today
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>All scheduled tasks completed</div>
              </>
            )}
          </div>

          {/* Insights */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>THIS WEEK INSIGHTS</div>
            {bestDay && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><Star size={14} color="var(--amber)" fill="var(--amber)" style={{ flexShrink: 0 }} /><div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Strongest</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', whiteSpace: 'nowrap' }}>{bestDay.label} · {bestDay.pct}%</div></div></div>}
            {worstDay && worstDay.label !== bestDay?.label && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0 }} /><div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Needs Focus</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>{worstDay.label} · {worstDay.pct}%</div></div></div>}
          </div>

          {/* Week Score */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>WEEK SCORE</div>
            <DonutChart percent={weekScore} size={84} color={weekScore >= 80 ? 'var(--green)' : weekScore >= 50 ? 'var(--amber)' : 'var(--red)'} />
          </div>

          {/* Week Totals */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>WEEK TOTALS</div>
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
                const isFuture = day && isFutureDay(day)
                return (
                  <div key={i} style={{ background: isToday ? 'var(--brand-primary-dim)' : 'var(--bg-card)', border: `1px solid ${isToday ? 'var(--brand-primary-glow)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '16px', opacity: day ? (isFuture ? 0.45 : 1) : 0.3, position: 'relative' }}>
                    {isFuture && (
                      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 12 }} title="Future day — cannot edit">🔒</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--cyan)' : 'var(--text-secondary)', letterSpacing: '0.08em' }}>{SHORT_DAYS[i]}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: isToday ? 'var(--cyan)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{day || '—'}</div>
                      </div>
                      <DonutChart percent={stats.pct} size={50} color={stats.pct >= 80 ? 'var(--green)' : stats.pct >= 50 ? 'var(--amber)' : 'var(--red)'} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {parsedTasks.map(task => (
                        <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: day && !isFuture ? 'pointer' : 'not-allowed', padding: '4px 0' }}>
                          <input type="checkbox" checked={day ? getChecked(day, task.name) : false} disabled={!day || isFuture} onChange={e => day && setChecked(day, task.name, e.target.checked)} style={{ accentColor: 'var(--cyan)', width: 14, height: 14, cursor: day && !isFuture ? 'pointer' : 'not-allowed' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 12, color: day && getChecked(day, task.name) ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: day && getChecked(day, task.name) ? 'line-through' : 'none', lineHeight: 1.2, transition: 'all 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                            {task.time && <span style={{ fontSize: 9, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>{task.time}</span>}
                          </div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>MANAGE TASKS</div>
                  {weekNum > 1 && (
                    <button onClick={copyFromLastWeek} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--cyan)', background: 'var(--cyan-dim)', border: '1px solid var(--brand-primary-glow)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-primary-dim)'; e.currentTarget.style.borderColor = 'var(--cyan)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--cyan-dim)'; e.currentTarget.style.borderColor = 'var(--brand-primary-glow)' }}>
                      <Copy size={12} /> Copy from Week {weekNum - 1}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {parsedTasks.map((t) => {
                    const isEditing = editingTask === t.name
                    return (
                      <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 8, border: isEditing ? '1px solid var(--cyan)' : '1px solid var(--border)' }}>
                        {isEditing ? (
                          <>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveRename(t.name)}
                                style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                autoFocus
                              />
                              <input
                                type="time"
                                value={editTime}
                                onChange={e => setEditTime(e.target.value)}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button onClick={() => handleSaveRename(t.name)} style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Check size={12} /> Save
                              </button>
                              <button onClick={() => setEditingTask(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                            {t.time && <span style={{ fontSize: 11, background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>{t.time}</span>}
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => { setEditingTask(t.name); setEditText(t.name); setEditTime(t.time) }} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--cyan)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Pencil size={15} /></button>
                              <button onClick={() => removeTask(t)} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><Trash2 size={15} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add task..." style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)' }} />
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 8px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                  <button onClick={addTask} style={{ background: 'var(--cyan-dim)', border: '1px solid var(--brand-primary-glow)', borderRadius: 8, color: 'var(--cyan)', padding: '10px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}><Plus size={18} /></button>
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

      {/* Floating In-App Toast Notifications for Desktop */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'rgba(19,21,29,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(0,229,255,0.1)', borderRadius: 12, padding: '14px 16px',
            width: '320px', pointerEvents: 'auto', animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} color="var(--cyan)" fill="var(--cyan)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.desc}</div>
              <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Scheduled for {t.time}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setChecked(new Date().getDate(), t.desc, true); setToasts(prev => prev.filter(x => x.id !== t.id)) }} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={14} /></button>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--border)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
