import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TaskTracker from './views/TaskTracker'
import HabitTracker from './views/HabitTracker'
import AuthPage from './views/AuthPage'
import { Loader } from 'lucide-react'

function Dashboard() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('tasks')

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: 10, color: 'var(--text-secondary)' }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Loading...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar active={view} onChange={setView} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        <div key={view} className="animate-in" style={{ height: '100%', overflow: 'hidden' }}>
          {view === 'tasks' ? <TaskTracker /> : <HabitTracker />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
