import React, { useState, useEffect } from 'react'
import {
  Save, RefreshCw, Edit2, Check, X, Loader,
  Settings as SettingsIcon, User, Shield, CheckSquare,
  Activity, ChevronRight, LogOut, Database
} from 'lucide-react'
import { tasksAPI, habitsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const SECTIONS = [
  { id: 'account', label: 'Account',      icon: User,         color: 'var(--cyan)' },
  { id: 'tasks',   label: 'Edit Tasks',   icon: CheckSquare,  color: 'var(--cyan)' },
  { id: 'habits',  label: 'Edit Habits',  icon: Activity,     color: 'var(--amber)' },
]

export default function SettingsView() {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('account')

  // Task editing
  const [taskWeeks, setTaskWeeks]     = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [editingTask, setEditingTask]  = useState(null)
  const [savingTask, setSavingTask]    = useState(false)
  const [taskMsg, setTaskMsg]         = useState('')

  // Habit editing
  const [habitData, setHabitData]       = useState(null)
  const [loadingHabits, setLoadingHabits] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [savingHabit, setSavingHabit]   = useState(false)
  const [habitMsg, setHabitMsg]         = useState('')

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`

  const loadTasks = async () => {
    setLoadingTasks(true)
    try {
      const res = await tasksAPI.getMonth(monthKey)
      setTaskWeeks(Object.entries(res.data || {}).map(([weekKey, data]) => ({ weekKey, ...data })))
    } catch { }
    finally { setLoadingTasks(false) }
  }

  const loadHabits = async () => {
    setLoadingHabits(true)
    try {
      const res = await habitsAPI.getMonth(monthKey)
      setHabitData(res.data)
    } catch { }
    finally { setLoadingHabits(false) }
  }

  useEffect(() => { loadTasks(); loadHabits() }, [])

  const saveTaskRename = async () => {
    if (!editingTask?.newName?.trim()) return
    setSavingTask(true)
    try {
      const week = taskWeeks.find(w => w.weekKey === editingTask.weekKey)
      if (!week) return
      const newTasks = week.tasks.map(t => t === editingTask.oldName ? editingTask.newName.trim() : t)
      const newChecks = {}
      Object.entries(week.checks || {}).forEach(([k, v]) => {
        const [day, ...rest] = k.split('-')
        const taskName = rest.join('-')
        newChecks[taskName === editingTask.oldName ? `${day}-${editingTask.newName.trim()}` : k] = v
      })
      await tasksAPI.upsertWeek(editingTask.weekKey, { tasks: newTasks, checks: newChecks, reflection: week.reflection || {} })
      setTaskMsg(`✓ Renamed "${editingTask.oldName}" → "${editingTask.newName}"`)
      setEditingTask(null)
      await loadTasks()
      setTimeout(() => setTaskMsg(''), 3000)
    } catch (e) { setTaskMsg('Error: ' + e.message) }
    finally { setSavingTask(false) }
  }

  const saveHabitRename = async () => {
    if (!editingHabit?.newName?.trim()) return
    setSavingHabit(true)
    try {
      const habits = habitData.habits.map(h => h.name === editingHabit.oldName ? { ...h, name: editingHabit.newName.trim() } : h)
      const newChecks = {}
      Object.entries(habitData.checks || {}).forEach(([k, v]) => {
        const [day, ...rest] = k.split('-')
        const habitName = rest.join('-')
        newChecks[habitName === editingHabit.oldName ? `${day}-${editingHabit.newName.trim()}` : k] = v
      })
      await habitsAPI.upsertMonth(monthKey, { habits, checks: newChecks, mental: habitData.mental || {} })
      setHabitMsg(`✓ Renamed "${editingHabit.oldName}" → "${editingHabit.newName}"`)
      setEditingHabit(null)
      await loadHabits()
      setTimeout(() => setHabitMsg(''), 3000)
    } catch (e) { setHabitMsg('Error: ' + e.message) }
    finally { setSavingHabit(false) }
  }

  const allTaskNames = [...new Set(taskWeeks.flatMap(w => w.tasks || []))]
  const habitNames   = habitData?.habits?.map(h => h.name) || []

  // ─── Shared sub-components ─────────────────────────────────────────────────
  const MsgBanner = ({ msg }) => msg ? (
    <div style={{
      background: msg.startsWith('✓') ? 'rgba(0,255,136,0.08)' : 'rgba(255,71,87,0.08)',
      border: `1px solid ${msg.startsWith('✓') ? 'rgba(0,255,136,0.3)' : 'rgba(255,71,87,0.3)'}`,
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 16,
    }}>{msg}</div>
  ) : null

  const inputStyle = {
    background: 'var(--bg-glass)', border: '1px solid var(--cyan)',
    borderRadius: 8, padding: '9px 12px', fontSize: 13,
    color: 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1,
  }

  // ─── Section content renderers ─────────────────────────────────────────────
  const AccountSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['Name', user?.name, '👤'], ['Email', user?.email, '📧']].map(([label, val, icon]) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 2 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{val || '—'}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'rgba(0,229,255,0.04)',
        borderRadius: 12, border: '1px solid rgba(0,229,255,0.12)',
      }}>
        <Shield size={16} color="var(--cyan)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your data is encrypted and stored securely in <strong style={{ color: 'var(--text-primary)' }}>MongoDB Atlas</strong>.
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'rgba(0,229,255,0.04)',
        borderRadius: 12, border: '1px solid rgba(0,229,255,0.12)',
      }}>
        <Database size={16} color="var(--cyan)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          All changes auto-save in real time — no action required.
        </div>
      </div>

      <button onClick={logout} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '14px', borderRadius: 12,
        background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.25)',
        color: 'var(--red)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,71,87,0.06)'}
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )

  const TasksSection = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Rename tasks for this month. Changes carry across all weeks.
        </div>
        <button onClick={loadTasks} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexShrink: 0, marginLeft: 12,
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <MsgBanner msg={taskMsg} />
      {loadingTasks ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '24px 0' }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading tasks...
        </div>
      ) : allTaskNames.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
          No tasks found for this month.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allTaskNames.map(taskName => {
            const isEditing = editingTask?.oldName === taskName
            return (
              <div key={taskName} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: 'var(--bg-glass)',
                borderRadius: 10, border: `1px solid ${isEditing ? 'var(--cyan)' : 'var(--border)'}`,
                transition: 'border-color 0.15s',
              }}>
                {isEditing ? (
                  <>
                    <input autoFocus value={editingTask.newName}
                      onChange={e => setEditingTask(p => ({ ...p, newName: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && saveTaskRename()}
                      style={inputStyle} />
                    <button onClick={saveTaskRename} disabled={savingTask}
                      style={{ background: 'var(--green)', border: 'none', borderRadius: 8, color: '#000', padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {savingTask ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                      Save
                    </button>
                    <button onClick={() => setEditingTask(null)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '9px 10px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{taskName}</span>
                    <button onClick={() => setEditingTask({ weekKey: taskWeeks.find(w => w.tasks?.includes(taskName))?.weekKey, oldName: taskName, newName: taskName })}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.borderColor = 'var(--cyan)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                      <Edit2 size={13} /> Rename
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const HabitsSection = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Rename habits for this month. Existing check data is preserved.
        </div>
        <button onClick={loadHabits} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexShrink: 0, marginLeft: 12,
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <MsgBanner msg={habitMsg} />
      {loadingHabits ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '24px 0' }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading habits...
        </div>
      ) : habitNames.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
          No habits found for this month.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habitData?.habits?.map(habit => {
            const isEditing = editingHabit?.oldName === habit.name
            return (
              <div key={habit.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', background: 'var(--bg-glass)',
                borderRadius: 10, border: `1px solid ${isEditing ? 'var(--amber)' : 'var(--border)'}`,
                transition: 'border-color 0.15s',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{habit.emoji}</span>
                {isEditing ? (
                  <>
                    <input autoFocus value={editingHabit.newName}
                      onChange={e => setEditingHabit(p => ({ ...p, newName: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && saveHabitRename()}
                      style={{ ...inputStyle, border: '1px solid var(--amber)' }} />
                    <button onClick={saveHabitRename} disabled={savingHabit}
                      style={{ background: 'var(--amber)', border: 'none', borderRadius: 8, color: '#000', padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {savingHabit ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                      Save
                    </button>
                    <button onClick={() => setEditingHabit(null)}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '9px 10px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{habit.name}</span>
                    <button onClick={() => setEditingHabit({ oldName: habit.name, newName: habit.name })}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.borderColor = 'var(--amber)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                      <Edit2 size={13} /> Rename
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const activeSection = activeTab === 'account' ? <AccountSection /> : activeTab === 'tasks' ? <TasksSection /> : <HabitsSection />
  const activeInfo = SECTIONS.find(s => s.id === activeTab)

  // ─── Mobile Layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

        {/* Header */}
        <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 6 }}>SETTINGS</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Settings</h1>

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {SECTIONS.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
                borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer',
                background: activeTab === id ? color + '18' : 'var(--bg-card)',
                border: `1px solid ${activeTab === id ? color : 'var(--border)'}`,
                color: activeTab === id ? color : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px 80px', animation: 'fadeUp 0.2s ease' }}>
          {activeSection}
        </div>
      </div>
    )
  }

  // ─── Desktop Layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>SETTINGS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SettingsIcon size={22} /> Settings
        </h1>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Left nav */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {SECTIONS.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              background: activeTab === id ? color + '14' : 'transparent',
              border: `1px solid ${activeTab === id ? color + '40' : 'transparent'}`,
              color: activeTab === id ? color : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (activeTab !== id) { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (activeTab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}

          {/* Spacer + logout */}
          <div style={{ flex: 1 }} />
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)',
            transition: 'all 0.15s', width: '100%',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.07)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(255,71,87,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          {/* Section header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              {activeInfo && <activeInfo.icon size={18} color={activeInfo.color} />}
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{activeInfo?.label}</h2>
            </div>
            <div style={{ width: 32, height: 3, borderRadius: 2, background: activeInfo?.color || 'var(--cyan)' }} />
          </div>

          <div style={{ maxWidth: 640 }}>
            {activeSection}
          </div>
        </div>
      </div>
    </div>
  )
}
