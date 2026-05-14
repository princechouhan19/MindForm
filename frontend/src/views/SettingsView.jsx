import React, { useState, useEffect } from 'react'
import {
  Edit2, Check, X, Loader, RefreshCw,
  User, CheckSquare, Activity, LogOut,
  ChevronRight, Pencil, Mail, AtSign
} from 'lucide-react'
import { tasksAPI, habitsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

const NAV = [
  { id: 'account', label: 'Profile',     icon: User,        color: 'var(--brand-primary)', desc: 'Your personal info' },
  { id: 'tasks',   label: 'Tasks',       icon: CheckSquare, color: 'var(--brand-primary)', desc: 'Rename this month\'s tasks' },
  { id: 'habits',  label: 'Habits',      icon: Activity,    color: 'var(--amber)',          desc: 'Rename this month\'s habits' },
]

export default function SettingsView() {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('account')

  const [taskWeeks,     setTaskWeeks]     = useState([])
  const [loadingTasks,  setLoadingTasks]  = useState(false)
  const [editingTask,   setEditingTask]   = useState(null)
  const [savingTask,    setSavingTask]    = useState(false)
  const [taskMsg,       setTaskMsg]       = useState('')

  const [habitData,     setHabitData]     = useState(null)
  const [loadingHabits, setLoadingHabits] = useState(false)
  const [editingHabit,  setEditingHabit]  = useState(null)
  const [savingHabit,   setSavingHabit]   = useState(false)
  const [habitMsg,      setHabitMsg]      = useState('')

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`

  const loadTasks = async () => {
    setLoadingTasks(true)
    try {
      const res = await tasksAPI.getMonth(monthKey)
      setTaskWeeks(Object.entries(res.data || {}).map(([weekKey, data]) => ({ weekKey, ...data })))
    } catch {}
    finally { setLoadingTasks(false) }
  }

  const loadHabits = async () => {
    setLoadingHabits(true)
    try {
      const res = await habitsAPI.getMonth(monthKey)
      setHabitData(res.data)
    } catch {}
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
        const tn = rest.join('-')
        newChecks[tn === editingTask.oldName ? `${day}-${editingTask.newName.trim()}` : k] = v
      })
      await tasksAPI.upsertWeek(editingTask.weekKey, { tasks: newTasks, checks: newChecks, reflection: week.reflection || {} })
      setTaskMsg(`✓ Renamed to "${editingTask.newName}"`)
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
        const hn = rest.join('-')
        newChecks[hn === editingHabit.oldName ? `${day}-${editingHabit.newName.trim()}` : k] = v
      })
      await habitsAPI.upsertMonth(monthKey, { habits, checks: newChecks, mental: habitData.mental || {} })
      setHabitMsg(`✓ Renamed to "${editingHabit.newName}"`)
      setEditingHabit(null)
      await loadHabits()
      setTimeout(() => setHabitMsg(''), 3000)
    } catch (e) { setHabitMsg('Error: ' + e.message) }
    finally { setSavingHabit(false) }
  }

  const allTaskNames = [...new Set(taskWeeks.flatMap(w => w.tasks || []))]
  const habitList    = habitData?.habits || []

  // ── helpers ──────────────────────────────────────────────────────────────────
  const Toast = ({ msg }) => !msg ? null : (
    <div style={{
      background: msg.startsWith('✓') ? 'var(--green-dim)' : 'var(--red-dim)',
      border: `1px solid ${msg.startsWith('✓') ? 'var(--green)' : 'var(--red)'}`,
      borderRadius: 10, padding: '10px 16px', fontSize: 13,
      color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)',
      marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {msg.startsWith('✓') ? <Check size={14} /> : <X size={14} />}
      {msg}
    </div>
  )

  const inputCls = (accentColor = 'var(--brand-primary)') => ({
    background: 'var(--bg-glass)', border: `1px solid ${accentColor}`,
    borderRadius: 8, padding: '9px 12px', fontSize: 14,
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)', flex: 1,
    outline: 'none',
  })

  const RenameRow = ({ label, emoji, isEditing, onEdit, editValue, onEditChange, onSave, onCancel, saving, accentColor = 'var(--brand-primary)' }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: 'var(--bg-surface)',
      borderRadius: 12, border: `1px solid ${isEditing ? accentColor : 'var(--border)'}`,
      transition: 'border-color 0.2s',
    }}>
      {emoji && <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>}
      {isEditing ? (
        <>
          <input
            autoFocus
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            style={inputCls(accentColor)}
          />
          <button onClick={onSave} disabled={saving} style={{
            background: accentColor, border: 'none', borderRadius: 8, color: '#000',
            padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
            Save
          </button>
          <button onClick={onCancel} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', padding: '9px 10px', cursor: 'pointer',
            display: 'flex', flexShrink: 0,
          }}>
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
          <button onClick={onEdit} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <Pencil size={12} /> Rename
          </button>
        </>
      )}
    </div>
  )

  // ── section panels ───────────────────────────────────────────────────────────
  const AccountPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile card */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Avatar band */}
        <div style={{
          height: 72, background: 'linear-gradient(135deg, var(--brand-primary-dim), var(--brand-secondary-dim, var(--purple-dim)))',
          borderBottom: '1px solid var(--border)', position: 'relative',
        }} />
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--brand-primary-dim)', border: '3px solid var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: -32, marginBottom: 12,
            fontSize: 26, fontWeight: 800, color: 'var(--brand-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>ACCOUNT INFO</div>
        </div>
        {[
          { icon: AtSign, label: 'Display Name', value: user?.name },
          { icon: Mail,   label: 'Email Address', value: user?.email },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={15} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SESSION</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sign out</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>You'll need to log in again to access your data</div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            color: 'var(--red)', transition: 'all 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,95,95,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red-dim)'}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  const TasksPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Toast msg={taskMsg} />
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>THIS MONTH'S TASKS</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Click rename to update a task name across all weeks</div>
          </div>
          <button onClick={loadTasks} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadingTasks ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0', justifyContent: 'center' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </div>
          ) : allTaskNames.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No tasks found for this month.</div>
          ) : (
            allTaskNames.map(name => {
              const isEditing = editingTask?.oldName === name
              return (
                <RenameRow
                  key={name}
                  label={name}
                  isEditing={isEditing}
                  onEdit={() => setEditingTask({ weekKey: taskWeeks.find(w => w.tasks?.includes(name))?.weekKey, oldName: name, newName: name })}
                  editValue={editingTask?.newName || ''}
                  onEditChange={v => setEditingTask(p => ({ ...p, newName: v }))}
                  onSave={saveTaskRename}
                  onCancel={() => setEditingTask(null)}
                  saving={savingTask}
                  accentColor="var(--brand-primary)"
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const HabitsPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Toast msg={habitMsg} />
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>THIS MONTH'S HABITS</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Rename habits — existing check data is preserved</div>
          </div>
          <button onClick={loadHabits} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadingHabits ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0', justifyContent: 'center' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </div>
          ) : habitList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No habits found for this month.</div>
          ) : (
            habitList.map(h => {
              const isEditing = editingHabit?.oldName === h.name
              return (
                <RenameRow
                  key={h.name}
                  label={h.name}
                  emoji={h.emoji}
                  isEditing={isEditing}
                  onEdit={() => setEditingHabit({ oldName: h.name, newName: h.name })}
                  editValue={editingHabit?.newName || ''}
                  onEditChange={v => setEditingHabit(p => ({ ...p, newName: v }))}
                  onSave={saveHabitRename}
                  onCancel={() => setEditingHabit(null)}
                  saving={savingHabit}
                  accentColor="var(--amber)"
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const activePanel = activeTab === 'account' ? <AccountPanel /> : activeTab === 'tasks' ? <TasksPanel /> : <HabitsPanel />
  const activeNav   = NAV.find(n => n.id === activeTab)

  // ── Mobile ───────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Settings</h1>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {NAV.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer',
              background: activeTab === id ? color + '18' : 'var(--bg-glass)',
              border: `1px solid ${activeTab === id ? color : 'var(--border)'}`,
              color: activeTab === id ? color : 'var(--text-muted)', transition: 'all 0.15s',
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 80px', animation: 'fadeUp 0.2s ease' }}>
        {activePanel}
      </div>
    </div>
  )

  // ── Desktop ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Sidebar nav */}
      <aside style={{
        width: 240, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 12px',
        background: 'var(--bg-surface)', gap: 2,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.14em', padding: '0 12px', marginBottom: 12 }}>SETTINGS</div>
        {NAV.map(({ id, label, icon: Icon, color, desc }) => {
          const active = activeTab === id
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: active ? color + '12' : 'transparent',
              border: `1px solid ${active ? color + '40' : 'transparent'}`,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s', textAlign: 'left', width: '100%',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-glass)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: active ? color + '20' : 'var(--bg-glass)',
                border: `1px solid ${active ? color + '40' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <Icon size={15} color={active ? color : 'var(--text-muted)'} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
              </div>
              {active && <ChevronRight size={14} color={color} style={{ marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Section title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: activeNav?.color || 'var(--text-muted)', letterSpacing: '0.14em', marginBottom: 6 }}>
            {activeNav?.label?.toUpperCase()}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            {activeTab === 'account' ? 'Your Profile' : activeTab === 'tasks' ? 'Manage Tasks' : 'Manage Habits'}
          </h2>
        </div>

        <div style={{ maxWidth: 600 }}>
          {activePanel}
        </div>
      </main>
    </div>
  )
}
