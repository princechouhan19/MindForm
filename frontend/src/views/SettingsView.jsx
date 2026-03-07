import React, { useState, useEffect } from 'react'
import { Save, RefreshCw, Edit2, Check, X, Loader, Settings as SettingsIcon, Database, User, Shield } from 'lucide-react'
import { tasksAPI, habitsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function SettingsView() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('tasks')

  // Task editing
  const [taskWeeks, setTaskWeeks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [editingTask, setEditingTask] = useState(null) // { weekKey, oldName, newName }
  const [savingTask, setSavingTask] = useState(false)
  const [taskMsg, setTaskMsg] = useState('')

  // Habit editing
  const [habitData, setHabitData] = useState(null)
  const [loadingHabits, setLoadingHabits] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [savingHabit, setSavingHabit] = useState(false)
  const [habitMsg, setHabitMsg] = useState('')

  const now = new Date()
  const yr = now.getFullYear(), mo = now.getMonth()
  const monthKey = `${yr}-${mo}`

  // Load current tasks
  const loadTasks = async () => {
    setLoadingTasks(true)
    try {
      const res = await tasksAPI.getMonth(monthKey)
      // getMonth returns { weekKey: { tasks, checks, reflection } }
      const weeksArray = Object.entries(res.data || {}).map(([weekKey, data]) => ({ weekKey, ...data }))
      setTaskWeeks(weeksArray)
    } catch (e) { /* noop */ }
    finally { setLoadingTasks(false) }
  }

  // Load current habits
  const loadHabits = async () => {
    setLoadingHabits(true)
    try {
      const res = await habitsAPI.getMonth(monthKey)
      setHabitData(res.data)
    } catch (e) { /* noop */ }
    finally { setLoadingHabits(false) }
  }

  useEffect(() => {
    loadTasks()
    loadHabits()
  }, [])

  // Rename task across ONE week
  const saveTaskRename = async () => {
    if (!editingTask || !editingTask.newName.trim()) return
    setSavingTask(true)
    try {
      const week = taskWeeks.find(w => w.weekKey === editingTask.weekKey)
      if (!week) return

      // Build updated tasks list
      const newTasks = week.tasks.map(t => t === editingTask.oldName ? editingTask.newName.trim() : t)

      // Update checks keys
      const newChecks = {}
      Object.entries(week.checks || {}).forEach(([k, v]) => {
        const [day, ...rest] = k.split('-')
        const taskName = rest.join('-')
        const newKey = taskName === editingTask.oldName ? `${day}-${editingTask.newName.trim()}` : k
        newChecks[newKey] = v
      })

      await tasksAPI.upsertWeek(editingTask.weekKey, { tasks: newTasks, checks: newChecks, reflection: week.reflection || {} })
      setTaskMsg(`✓ Renamed "${editingTask.oldName}" → "${editingTask.newName}"`)
      setEditingTask(null)
      await loadTasks()
      setTimeout(() => setTaskMsg(''), 3000)
    } catch (e) { setTaskMsg('Error: ' + e.message) }
    finally { setSavingTask(false) }
  }

  // Rename habit
  const saveHabitRename = async () => {
    if (!editingHabit || !editingHabit.newName.trim()) return
    setSavingHabit(true)
    try {
      const habits = habitData.habits.map(h =>
        h.name === editingHabit.oldName ? { ...h, name: editingHabit.newName.trim() } : h
      )
      const newChecks = {}
      Object.entries(habitData.checks || {}).forEach(([k, v]) => {
        const [day, ...rest] = k.split('-')
        const habitName = rest.join('-')
        const newKey = habitName === editingHabit.oldName ? `${day}-${editingHabit.newName.trim()}` : k
        newChecks[newKey] = v
      })
      await habitsAPI.upsertMonth(monthKey, { habits, checks: newChecks, mental: habitData.mental || {} })
      setHabitMsg(`✓ Renamed "${editingHabit.oldName}" → "${editingHabit.newName}"`)
      setEditingHabit(null)
      await loadHabits()
      setTimeout(() => setHabitMsg(''), 3000)
    } catch (e) { setHabitMsg('Error: ' + e.message) }
    finally { setSavingHabit(false) }
  }

  const tabStyle = (t) => ({
    padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${activeTab === t ? 'var(--cyan)' : 'var(--border)'}`,
    background: activeTab === t ? 'var(--cyan-dim)' : 'transparent',
    color: activeTab === t ? 'var(--cyan)' : 'var(--text-muted)',
    transition: 'all 0.15s',
  })

  const input = {
    background: 'var(--bg-glass)', border: '1px solid var(--cyan)', borderRadius: 8,
    padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', outline: 'none', flex: 1,
  }

  // Get all unique tasks across weeks
  const allTaskNames = [...new Set(taskWeeks.flatMap(w => w.tasks || []))]
  const habitNames = habitData?.habits?.map(h => h.name) || []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>SETTINGS</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
            <SettingsIcon size={24} /> Settings
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={tabStyle('tasks')} onClick={() => setActiveTab('tasks')}>Edit Tasks</button>
          <button style={tabStyle('habits')} onClick={() => setActiveTab('habits')}>Edit Habits</button>
          <button style={tabStyle('account')} onClick={() => setActiveTab('account')}>Account</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {/* ---- TASK EDIT TAB ---- */}
        {activeTab === 'tasks' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Edit Task Names</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Fix spelling errors or rename tasks for this month</div>
                </div>
                <button onClick={loadTasks} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {taskMsg && (
                <div style={{ background: taskMsg.startsWith('✓') ? 'rgba(0,200,100,0.1)' : 'rgba(255,71,87,0.1)', border: `1px solid ${taskMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: taskMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 16 }}>
                  {taskMsg}
                </div>
              )}

              {loadingTasks ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0' }}>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading tasks...
                </div>
              ) : allTaskNames.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>No tasks found for this month.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allTaskNames.map(taskName => {
                    const isEditing = editingTask?.oldName === taskName
                    return (
                      <div key={taskName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 10, border: `1px solid ${isEditing ? 'var(--cyan)' : 'var(--border)'}`, transition: 'border-color 0.15s' }}>
                        {isEditing ? (
                          <>
                            <input
                              autoFocus
                              value={editingTask.newName}
                              onChange={e => setEditingTask(p => ({ ...p, newName: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && saveTaskRename()}
                              style={input}
                            />
                            <button onClick={saveTaskRename} disabled={savingTask}
                              style={{ background: 'var(--green)', border: 'none', borderRadius: 7, color: '#000', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                              {savingTask ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                              Save
                            </button>
                            <button onClick={() => setEditingTask(null)}
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{taskName}</span>
                            <button onClick={() => setEditingTask({ weekKey: taskWeeks.find(w => w.tasks?.includes(taskName))?.weekKey, oldName: taskName, newName: taskName })}
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, transition: 'all 0.15s' }}
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
          </div>
        )}

        {/* ---- HABIT EDIT TAB ---- */}
        {activeTab === 'habits' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Edit Habit Names</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Fix spelling errors or rename habits for this month</div>
                </div>
                <button onClick={loadHabits} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {habitMsg && (
                <div style={{ background: habitMsg.startsWith('✓') ? 'rgba(0,200,100,0.1)' : 'rgba(255,71,87,0.1)', border: `1px solid ${habitMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: habitMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom: 16 }}>
                  {habitMsg}
                </div>
              )}

              {loadingHabits ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0' }}>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading habits...
                </div>
              ) : habitNames.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>No habits found for this month.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {habitNames.map(habitName => {
                    const habit = habitData?.habits?.find(h => h.name === habitName)
                    const isEditing = editingHabit?.oldName === habitName
                    return (
                      <div key={habitName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 10, border: `1px solid ${isEditing ? 'var(--amber)' : 'var(--border)'}`, transition: 'border-color 0.15s' }}>
                        <span style={{ fontSize: 18 }}>{habit?.emoji || '✨'}</span>
                        {isEditing ? (
                          <>
                            <input
                              autoFocus
                              value={editingHabit.newName}
                              onChange={e => setEditingHabit(p => ({ ...p, newName: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && saveHabitRename()}
                              style={{ ...input, border: '1px solid var(--amber)' }}
                            />
                            <button onClick={saveHabitRename} disabled={savingHabit}
                              style={{ background: 'var(--amber)', border: 'none', borderRadius: 7, color: '#000', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                              {savingHabit ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                              Save
                            </button>
                            <button onClick={() => setEditingHabit(null)}
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{habitName}</span>
                            <button onClick={() => setEditingHabit({ oldName: habitName, newName: habitName })}
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, transition: 'all 0.15s' }}
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
          </div>
        )}

        {/* ---- ACCOUNT TAB ---- */}
        {activeTab === 'account' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> Account Info</div>
              {[['Name', user?.name], ['Email', user?.email]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
              <div style={{ padding: '12px 16px', background: 'rgba(0,229,255,0.05)', borderRadius: 10, border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Shield size={14} color="var(--cyan)" /> Your data is stored securely in MongoDB Atlas
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
