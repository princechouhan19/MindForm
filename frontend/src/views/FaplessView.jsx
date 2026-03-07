import React, { useState, useEffect, useCallback } from 'react'
import {
  Flame, Shield, Trophy, AlertTriangle, RotateCcw, Zap, Star,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Lightbulb,
  Smartphone, Monitor, Globe, Lock, Play, Calendar, RefreshCw
} from 'lucide-react'
import { faplessAPI } from '../api/client'

// ─── LEVEL SYSTEM ────────────────────────────────────────────────────────────
const LEVELS = [
  { id: 'clown',        label: '🤡 Clown',              minDays: 0,   maxDays: 0,    auraPerDay: 0,   color: '#a0a0a0', desc: 'Day 0 — The journey begins today.' },
  { id: 'noob',         label: '😐 Noob',               minDays: 1,   maxDays: 6,    auraPerDay: 10,  color: '#cd7f32', desc: 'You took the first step. Most people never do.' },
  { id: 'novice',       label: '🌱 Novice',             minDays: 7,   maxDays: 13,   auraPerDay: 20,  color: '#8fbc8f', desc: 'One week strong. Your brain is starting to rewire.' },
  { id: 'average',      label: '🙂 Average',            minDays: 14,  maxDays: 29,   auraPerDay: 35,  color: '#6495ed', desc: 'Two weeks. Dopamine receptors are healing.' },
  { id: 'advanced',     label: '⚡ Advanced',            minDays: 30,  maxDays: 44,   auraPerDay: 55,  color: '#9370db', desc: '30 days — The infamous "30-day mark". Brain fog is lifting.' },
  { id: 'sigma',        label: '🔱 Sigma',              minDays: 45,  maxDays: 59,   auraPerDay: 80,  color: '#00bfff', desc: '45 days. Confidence, energy, and clarity are surging.' },
  { id: 'chad',         label: '💪 Chad',               minDays: 60,  maxDays: 89,   auraPerDay: 110, color: '#ffd700', desc: '60 days. People notice the change. You are becoming.' },
  { id: 'absolute_chad',label: '🦁 Absolute Chad',      minDays: 90,  maxDays: 119,  auraPerDay: 150, color: '#ff8c00', desc: '90-day reboot complete. This is real transformation.' },
  { id: 'gigachad',     label: '👑 Giga Chad',          minDays: 120, maxDays: 364,  auraPerDay: 200, color: '#ff4500', desc: '120+ days. You operate on a different frequency.' },
  { id: 'abs_gigachad', label: '🌌 Absolute Giga Chad', minDays: 365, maxDays: Infinity, auraPerDay: 365, color: '#ff00ff', desc: '365 days. You have completely transcended. A new human.' },
]

function getLevel(days) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (days >= LEVELS[i].minDays) return LEVELS[i]
  }
  return LEVELS[0]
}

function getNextLevel(days) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (days < LEVELS[i].minDays) return LEVELS[i]
  }
  return null
}

function calcAura(days) {
  let aura = 0
  for (const lvl of LEVELS) {
    if (days <= 0) break
    const daysInLevel = Math.min(days, (lvl.maxDays === Infinity ? days : lvl.maxDays) - lvl.minDays + 1)
    if (daysInLevel <= 0) continue
    aura += daysInLevel * lvl.auraPerDay
  }
  return aura
}

// ─── LEVEL BENEFITS ───────────────────────────────────────────────────────────
const BENEFITS = {
  noob:          ['• Reduced urge intensity', '• Better sleep quality starts', '• You broke the cycle — that\'s huge'],
  novice:        ['• Energy levels rising', '• Brain fog decreasing', '• Improved focus for 20-30 min tasks', '• Reduced social anxiety'],
  average:       ['• Dopamine receptors partially healed', '• Morning motivation boost', '• Clearer thinking & sharper memory', '• More emotional control'],
  advanced:      ['• Full dopamine reset nearly complete', '• Natural confidence in social settings', '• Physical strength & stamina up', '• Eye contact feels natural', '• Deeper voice reported by many'],
  sigma:         ['• Aura is felt by others', '• Deep focus for 2+ hours', '• Attraction energy noticeably different', '• Discipline spills into all areas of life'],
  chad:          ['• Operating at peak mental clarity', '• Emotional mastery — no longer reactive', '• Drive to build, create, earn', '• 60-day neurological transformation confirmed by science'],
  absolute_chad: ['• 90-day full reboot ✅', '• Complete dopamine system restored', '• Social presence radiates confidence', '• Life goals feel achievable and clear'],
  gigachad:      ['• 120+ days — elite 1% of men', '• Naturally magnetizing personality', '• High energy all day without stimulants', '• Deep work sessions of 4+ hours'],
  abs_gigachad:  ['• 365 days — absolute legend', '• You have rewritten your identity', '• Limitless discipline applied to every domain', '• You are the standard, not the exception'],
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────────
const CHALLENGES = [
  { id: 'NNN',    label: '🚫 No Nut November (NNN)',   duration: 30,  desc: 'Classic November challenge. 30 days of total abstinence.', auraBonus: 500 },
  { id: 'NYR',    label: '🎆 New Year Reset (NYR)',     duration: 30,  desc: 'Start the new year with a clean slate. 30 days.', auraBonus: 500 },
  { id: '30day',  label: '📅 30-Day Challenge',         duration: 30,  desc: 'The starter challenge. Proven to rewire your brain.', auraBonus: 300 },
  { id: '90day',  label: '🔥 90-Day Reboot',            duration: 90,  desc: 'The scientifically studied reboot period. Full reset.', auraBonus: 1200 },
  { id: '180day', label: '💎 180-Day Diamond',          duration: 180, desc: 'Half a year of mastery. Legendary status incoming.', auraBonus: 3000 },
  { id: 'year',   label: '🌌 The Annual Ascension',     duration: 365, desc: 'One full year. Absolute Giga Chad territory.', auraBonus: 9999 },
  { id: 'hardmode', label: '⚔️ Hard Mode (No PMO)',   duration: 90,  desc: 'No Porn, No Masturbation, No Orgasm. The ultimate test.', auraBonus: 2000 },
]

// ─── MOTIVATIONAL / DE-MOTIVATIONAL QUOTES ────────────────────────────────────
const DEMOTIVATIONAL = [
  '"Every time you relapse, you sell a piece of your future self."',
  '"The dopamine hit lasts 5 seconds. The shame lasts days."',
  '"You chose 5 minutes of weakness over months of progress."',
  '"The you from 90 days from now is disappointed."',
  '"Porn is rented pleasure with a permanent cost."',
  '"Every relapse tells your brain: I have no control."',
]
const MOTIVATIONAL = [
  '"Every day clean is a vote for the person you want to become."',
  '"The urge will pass in 10 minutes. Your strength lasts forever."',
  '"Discipline is choosing your future self over your present feelings."',
  '"You didn\'t come this far to only come this far."',
  '"The hardest battle is with yourself. Win it."',
  '"Real men master themselves first."',
  '"Your energy is sacred. Protect it."',
  '"Every day you hold is a day your dopamine receptors heal."',
]

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    cat: '📱 Mobile Apps',
    icon: Smartphone,
    color: '#00bfff',
    items: [
      { name: 'BlockSite', desc: 'Block adult sites on Android & iOS with a password lock.' },
      { name: 'Cold Turkey (iOS)', desc: 'Hard block with a commitment mode — can\'t be overridden.' },
      { name: 'Pluckeye', desc: 'Gradually reduces image content. Extreme mode available.' },
      { name: 'Covenant Eyes', desc: 'Accountability app — sends report to a trusted person.' },
    ]
  },
  {
    cat: '💻 PC Extensions',
    icon: Monitor,
    color: '#9370db',
    items: [
      { name: 'BlockSite (Chrome/Firefox)', desc: 'Add any site to a blocklist instantly.' },
      { name: 'Cold Turkey Blocker', desc: 'Blocks at OS level — even in incognito. Unbeatable.' },
      { name: 'uBlock Origin', desc: 'Block entire domains by adding filter rules.' },
      { name: 'LeechBlock NG (Firefox)', desc: 'Schedule blocks by time of day.' },
    ]
  },
  {
    cat: '🌐 Browser Settings',
    icon: Globe,
    color: '#ffd700',
    items: [
      { name: 'Enable Safe Search', desc: 'Go to Google Settings → Turn on SafeSearch and lock it.' },
      { name: 'Use Family DNS', desc: 'Set DNS to 1.1.1.3 (Cloudflare Family) — blocks adult content at network level.' },
      { name: 'Router Parental Controls', desc: 'Block content for all devices on your network via router settings.' },
      { name: 'Create separate browser profile', desc: 'Use a clean profile for work/study with extensions locked.' },
    ]
  },
  {
    cat: '🔒 System-Level',
    icon: Lock,
    color: '#ff8c00',
    items: [
      { name: 'Hosts file editing', desc: 'Add blocked domains to C:/Windows/System32/drivers/etc/hosts' },
      { name: 'OpenDNS FamilyShield', desc: '208.67.222.123 — free DNS that blocks adult content globally.' },
      { name: 'Accountability partner', desc: 'Share your streak with a trusted friend. Social pressure works.' },
      { name: 'Delete saved passwords', desc: 'Remove easy access. Friction kills urges.' },
    ]
  },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function FaplessView() {
  const isMobile = useIsMobile()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showRelapse, setShowRelapse] = useState(false)
  const [relapseReason, setRelapseReason] = useState('')
  const [relapseQuote, setRelapseQuote] = useState('')
  const [quoteType, setQuoteType] = useState('')

  const [expandedSection, setExpandedSection] = useState('benefits')
  const [activeSuggCat, setActiveSuggCat] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    faplessAPI.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Derived state ─────────────────────────────────────────────────────────
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000) // update every minute
    return () => clearInterval(t)
  }, [])

  const totalMs = data?.startDate ? now - new Date(data.startDate).getTime() : 0
  const streakDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const streakHrs  = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const streakMins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))

  const currentLevel = getLevel(streakDays)
  const nextLevel = getNextLevel(streakDays)
  const auraPoints = calcAura(streakDays)
  const progressToNext = nextLevel
    ? Math.round(((streakDays - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100)
    : 100

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (data?.startDate && !confirm('This will reset your current streak. Start a fresh streak from today?')) return
    setSaving(true)
    try {
      const res = await faplessAPI.start()
      setData(res.data)
    } finally { setSaving(false) }
  }

  const handleRelapse = async () => {
    if (!relapseReason.trim()) {
      alert('Please enter a reason — understanding why helps you improve.')
      return
    }
    setSaving(true)
    try {
      const res = await faplessAPI.relapse(relapseReason, streakDays)
      setData(res.data)
      const isDemotivational = streakDays < 7
      const pool = isDemotivational ? DEMOTIVATIONAL : MOTIVATIONAL
      const q = pool[Math.floor(Math.random() * pool.length)]
      setRelapseQuote(q)
      setQuoteType(isDemotivational ? 'demotivational' : 'motivational')
      setRelapseReason('')
      setShowRelapse(false)
    } finally { setSaving(false) }
  }

  const setChallenge = async (id) => {
    setSaving(true)
    try {
      const res = await faplessAPI.update({
        startDate: data?.startDate,
        activeChallenge: id,
        notes: data?.notes || '',
      })
      setData(res.data)
    } finally { setSaving(false) }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '20px 22px',
  }

  const sectionBtn = (id) => ({
    background: expandedSection === id ? 'rgba(255,255,255,0.05)' : 'none',
    border: '1px solid ' + (expandedSection === id ? 'var(--border-bright)' : 'var(--border)'),
    borderRadius: 10,
    color: 'var(--text-primary)',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    transition: 'all 0.15s',
    marginBottom: 8,
  })

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: 10, flexDirection: 'column' }}>
      <Flame size={36} color="#ff4500" style={{ animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ fontSize: 14 }}>Loading Fapless...</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} } @keyframes spin { to { transform: rotate(360deg) } } @keyframes glow { 0%,100%{box-shadow:0 0 10px ${currentLevel?.color || '#ff4500'}44} 50%{box-shadow:0 0 30px ${currentLevel?.color || '#ff4500'}88} }`}</style>
    </div>
  )

  if (relapseQuote) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, padding: 40 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      <div style={{ fontSize: 48 }}>{quoteType === 'demotivational' ? '😔' : '💪'}</div>
      <div style={{
        maxWidth: 560, textAlign: 'center', fontSize: isMobile ? 17 : 20, fontWeight: 700, lineHeight: 1.6,
        color: quoteType === 'demotivational' ? 'var(--red)' : 'var(--green)',
        fontStyle: 'italic', padding: '0 16px',
      }}>{relapseQuote}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400, padding: '0 16px' }}>
        Your streak has been reset. But every legend has a chapter of failure.<br />
        <strong style={{ color: 'var(--text-primary)' }}>Start again. Right now.</strong>
      </div>
      <button onClick={() => { setRelapseQuote(''); load() }}
        style={{ background: 'linear-gradient(135deg, var(--cyan), #0077ff)', border: 'none', borderRadius: 12, color: '#000', padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <RefreshCw size={16} /> Start Fresh Journey
      </button>
    </div>
  )

  // ─── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    const toggle = (id) => setExpandedSection(s => s === id ? '' : id)
    const sec = (id, icon, label, color) => ({
      background: expandedSection === id ? 'rgba(255,255,255,0.04)' : 'none',
      border: `1px solid ${expandedSection === id ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
      borderRadius: 12, color: 'var(--text-primary)', padding: '14px 16px', cursor: 'pointer',
      fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', transition: 'all 0.15s', marginBottom: 8,
    })
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes glow { 0%,100%{box-shadow:0 0 12px ${currentLevel.color}44} 50%{box-shadow:0 0 28px ${currentLevel.color}88} }
          @keyframes auraFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          .fapless-card:hover { border-color: var(--border-bright) !important; }
        `}</style>

        {/* Mobile Hero */}
        <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#ff4500', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 4 }}>FAPLESS TRACKER</div>

          {/* Main hero card */}
          <div style={{
            background: `linear-gradient(135deg, var(--bg-card), ${currentLevel.color}0a)`,
            border: `1px solid ${currentLevel.color}44`,
            borderRadius: 16, padding: '18px 16px', marginBottom: 12,
            animation: 'glow 3s ease infinite', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${currentLevel.color}06 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Days + time */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>STREAK</div>
                <div style={{ fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-mono)', color: currentLevel.color, lineHeight: 1, animation: 'auraFloat 4s ease infinite' }}>{streakDays}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>days</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentLevel.color, opacity: 0.8, lineHeight: 1 }}>{String(streakHrs).padStart(2,'0')}</div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>HRS</div>
                  </div>
                  <div style={{ fontSize: 13, color: currentLevel.color, opacity: 0.3, marginBottom: 6 }}>:</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentLevel.color, opacity: 0.8, lineHeight: 1 }}>{String(streakMins).padStart(2,'0')}</div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MINS</div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, background: `${currentLevel.color}22`, alignSelf: 'stretch' }} />

              {/* Level + Aura */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>CURRENT LEVEL</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: currentLevel.color, marginBottom: 4, lineHeight: 1.2 }}>{currentLevel.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{currentLevel.desc}</div>
                {nextLevel && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>→ {nextLevel.label.split(' ').slice(1).join(' ')}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{nextLevel.minDays - streakDays}d left</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${progressToNext}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <Zap size={13} color="#ffd700" fill="#ffd700" />
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffd700' }}>{auraPoints.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>aura</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {!data?.startDate ? (
              <button onClick={handleStart} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #ff4500, #ff8c00)', border: 'none', borderRadius: 12, color: '#fff', padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Play size={17} /> Start Journey
              </button>
            ) : (
              <>
                <button onClick={() => setShowRelapse(s => !s)} style={{ flex: 1, background: showRelapse ? 'rgba(255,71,87,0.1)' : 'var(--bg-card)', border: '1px solid rgba(255,71,87,0.35)', borderRadius: 12, color: 'var(--red)', padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <RotateCcw size={15} /> Relapse
                </button>
                <button onClick={handleStart} disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #ff4500, #ff8c00)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <RefreshCw size={15} /> Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Relapse panel */}
        {showRelapse && (
          <div style={{ margin: '0 14px', background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 12, padding: '16px', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> Be honest — what triggered you?
            </div>
            <textarea value={relapseReason} onChange={e => setRelapseReason(e.target.value)}
              placeholder="Boredom, stress, loneliness, late night phone..."
              rows={3} style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', resize: 'none', lineHeight: 1.5, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={handleRelapse} disabled={saving || !relapseReason.trim()}
                style={{ flex: 1, background: 'var(--red)', border: 'none', borderRadius: 8, color: '#fff', padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: relapseReason.trim() ? 1 : 0.5 }}>
                Confirm Relapse
              </button>
              <button onClick={() => { setShowRelapse(false); setRelapseReason('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '11px 16px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Scrollable accordion sections */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px 80px' }}>

          {/* Benefits */}
          <button onClick={() => toggle('benefits')} style={sec('benefits')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Star size={15} color="var(--amber)" /> My Level Benefits</span>
            {expandedSection === 'benefits' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'benefits' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
              {BENEFITS[currentLevel.id] ? BENEFITS[currentLevel.id].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < BENEFITS[currentLevel.id].length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <CheckCircle2 size={15} color={currentLevel.color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{b.replace('• ', '')}</span>
                </div>
              )) : <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Benefits unlock at Day 1+</div>}
            </div>
          )}

          {/* Level Roadmap */}
          <button onClick={() => toggle('levels')} style={sec('levels')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={15} color="#ffd700" /> Level Roadmap</span>
            {expandedSection === 'levels' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'levels' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
              {LEVELS.map((lvl, i) => {
                const isActive = lvl.id === currentLevel.id
                const isLocked = streakDays < lvl.minDays
                return (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < LEVELS.length - 1 ? '1px solid var(--border)' : 'none', opacity: isLocked ? 0.4 : 1 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{isLocked ? '🔒' : isActive ? lvl.label.split(' ')[0] : '✅'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? lvl.color : 'var(--text-primary)' }}>{lvl.label}</span>
                        {isActive && <span style={{ fontSize: 9, background: lvl.color, color: '#000', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.maxDays === Infinity ? `${lvl.minDays}+ days` : lvl.minDays === lvl.maxDays ? `Day ${lvl.minDays}` : `${lvl.minDays}–${lvl.maxDays} days`} · +{lvl.auraPerDay} aura/day</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Challenges */}
          <button onClick={() => toggle('challenges')} style={sec('challenges')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Flame size={15} color="#ff4500" /> Challenges</span>
            {expandedSection === 'challenges' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'challenges' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CHALLENGES.map(ch => {
                const isActive = data?.activeChallenge === ch.id
                const isComplete = isActive && streakDays >= ch.duration
                return (
                  <div key={ch.id} onClick={() => setChallenge(isActive ? '' : ch.id)} style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? 'rgba(255,69,0,0.08)' : 'var(--bg-glass)',
                    border: `1px solid ${isActive ? '#ff4500' : 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#ff4500' : 'var(--text-primary)' }}>{ch.label}</span>
                      {isActive && <span style={{ fontSize: 9, background: isComplete ? 'var(--green)' : '#ff4500', color: isComplete ? '#000' : '#fff', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>{isComplete ? 'DONE ✅' : 'ACTIVE'}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{ch.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.duration} days</span>
                      <span style={{ fontSize: 11, color: '#ffd700', fontWeight: 700 }}>⚡ +{ch.auraBonus.toLocaleString()}</span>
                    </div>
                    {isActive && !isComplete && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.round((streakDays / ch.duration) * 100))}%`, background: 'linear-gradient(90deg,#ff4500,#ffd700)', borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{ch.duration - streakDays} days left</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Anti-Relapse Arsenal */}
          <button onClick={() => toggle('suggestions')} style={sec('suggestions')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lightbulb size={15} color="var(--cyan)" /> Anti-Relapse Tools</span>
            {expandedSection === 'suggestions' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {expandedSection === 'suggestions' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setActiveSuggCat(i)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, border: `1px solid ${activeSuggCat === i ? s.color : 'var(--border)'}`, background: activeSuggCat === i ? s.color + '20' : 'transparent', color: activeSuggCat === i ? s.color : 'var(--text-muted)' }}>
                    {s.cat.split(' ')[0]}
                  </button>
                ))}
              </div>
              {(() => {
                const sg = SUGGESTIONS[activeSuggCat]
                return sg.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < sg.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: sg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <sg.icon size={15} color={sg.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Relapse History */}
          {data?.relapses?.length > 0 && (
            <>
              <button onClick={() => toggle('history')} style={sec('history')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={15} color="var(--text-muted)" /> History ({data.relapses.length})</span>
                {expandedSection === 'history' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {expandedSection === 'history' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', marginBottom: 10 }}>
                  {[...data.relapses].reverse().map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: i < data.relapses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{r.reason || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, flexShrink: 0 }}>Day {r.dayCount}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Daily Quote */}
          <div style={{ background: `linear-gradient(135deg, var(--bg-card), ${currentLevel.color}08)`, border: `1px solid ${currentLevel.color}30`, borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 10 }}>TODAY'S REMINDER</div>
            <div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
              {MOTIVATIONAL[Math.floor((streakDays + new Date().getDate()) % MOTIVATIONAL.length)]}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} color={currentLevel.color} />
              <span style={{ fontSize: 11, color: currentLevel.color, fontWeight: 600 }}>Every day counts.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
        @keyframes glow {
          0%,100%{box-shadow:0 0 12px ${currentLevel.color}44}
          50%{box-shadow:0 0 32px ${currentLevel.color}88}
        }
        @keyframes auraFloat {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}
        }
        .fapless-card:hover { border-color: var(--border-bright) !important; }
      `}</style>

      {/* Header */}
      <div className="view-pad" style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#ff4500', fontWeight: 600, letterSpacing: '0.15em', marginBottom: 6 }}>FAPLESS</div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>NoFap Tracker</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!data?.startDate ? (
              <button onClick={handleStart} disabled={saving}
                style={{ background: 'linear-gradient(135deg, #ff4500, #ff8c00)', border: 'none', borderRadius: 12, color: '#fff', padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Play size={16} /> Start Journey
              </button>
            ) : (
              <>
                <button onClick={() => setShowRelapse(s => !s)}
                  style={{ background: showRelapse ? 'rgba(255,71,87,0.15)' : 'none', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 10, color: 'var(--red)', padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RotateCcw size={14} /> Relapse
                </button>
                <button onClick={handleStart} disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #ff4500, #ff8c00)', border: 'none', borderRadius: 10, color: '#fff', padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <RefreshCw size={14} /> Reset Streak
                </button>
              </>
            )}
          </div>
        </div>

        {/* Relapse panel */}
        {showRelapse && (
          <div style={{ ...card, marginBottom: 16, border: '1px solid rgba(255,71,87,0.4)', background: 'rgba(255,71,87,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Record Relapse — Be honest with yourself
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Current streak: <strong style={{ color: 'var(--text-primary)' }}>{streakDays} day{streakDays !== 1 ? 's' : ''}</strong> — this will reset to 0.
            </div>
            <textarea
              value={relapseReason}
              onChange={e => setRelapseReason(e.target.value)}
              placeholder="What triggered you? (boredom, stress, loneliness, late night phone, etc.)"
              rows={3}
              style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleRelapse} disabled={saving || !relapseReason.trim()}
                style={{ background: 'var(--red)', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: relapseReason.trim() ? 1 : 0.5 }}>
                <XCircle size={14} /> Confirm Relapse
              </button>
              <button onClick={() => { setShowRelapse(false); setRelapseReason('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="view-scroll" style={{ flex: 1, overflow: 'auto', padding: '0 24px 28px' }}>

        {/* ── Hero: Streak + Level ── */}
        <div className="grid-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Streak counter */}
          <div style={{ ...card, textAlign: 'center', animation: 'glow 3s ease infinite', border: `1px solid ${currentLevel.color}55`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${currentLevel.color}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8 }}>CURRENT STREAK</div>
            <div style={{ fontSize: 64, fontWeight: 900, fontFamily: 'var(--font-mono)', color: currentLevel.color, lineHeight: 1, animation: 'auraFloat 4s ease infinite' }}>
              {streakDays}
            </div>
            {/* Hours & Minutes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentLevel.color, opacity: 0.8, lineHeight: 1 }}>{String(streakHrs).padStart(2,'0')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>HRS</div>
              </div>
              <div style={{ fontSize: 18, color: currentLevel.color, opacity: 0.4, lineHeight: 1, marginBottom: 4 }}>:</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: currentLevel.color, opacity: 0.8, lineHeight: 1 }}>{String(streakMins).padStart(2,'0')}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>MINS</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>day{streakDays !== 1 ? 's' : ''}</div>
            {data?.startDate && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Since {new Date(data.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
            {!data?.startDate && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Click "Start Journey" to begin</div>
            )}
          </div>

          {/* Level */}
          <div style={{ ...card, textAlign: 'center', border: `1px solid ${currentLevel.color}44`, background: `linear-gradient(135deg, var(--bg-card), ${currentLevel.color}08)` }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 10 }}>CURRENT LEVEL</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: currentLevel.color, marginBottom: 6, lineHeight: 1.2 }}>{currentLevel.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{currentLevel.desc}</div>
            {nextLevel && (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Next: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{nextLevel.label}</span> in {nextLevel.minDays - streakDays} day{nextLevel.minDays - streakDays !== 1 ? 's' : ''}
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressToNext}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </>
            )}
            {!nextLevel && <div style={{ fontSize: 12, color: currentLevel.color, fontWeight: 700 }}>🏆 MAX LEVEL REACHED</div>}
          </div>

          {/* Aura */}
          <div style={{ ...card, textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-card), rgba(255,215,0,0.05))' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8 }}>AURA POINTS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={22} color="#ffd700" fill="#ffd700" />
              <span style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#ffd700', lineHeight: 1 }}>{auraPoints.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              +{currentLevel.auraPerDay} aura/day at this level
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Total relapses: <span style={{ color: data?.relapses?.length > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>{data?.relapses?.length || 0}</span>
            </div>
          </div>
        </div>  {/* end hero grid */}

        {/* ── All Levels Map ── */}
        <button onClick={() => setExpandedSection(s => s === 'levels' ? '' : 'levels')} style={sectionBtn('levels')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={15} color="#ffd700" /> Level Roadmap</span>
          {expandedSection === 'levels' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {expandedSection === 'levels' && (
          <div style={{ ...card, marginBottom: 12, padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEVELS.map((lvl, i) => {
                const isActive = lvl.id === currentLevel.id
                const isPassed = streakDays >= lvl.minDays && lvl.id !== currentLevel.id && lvl.maxDays < Infinity
                const isLocked = streakDays < lvl.minDays
                return (
                  <div key={lvl.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    borderRadius: 10, border: `1px solid ${isActive ? lvl.color : 'var(--border)'}`,
                    background: isActive ? lvl.color + '12' : 'var(--bg-glass)',
                    opacity: isLocked ? 0.45 : 1, transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: isActive ? lvl.color + '22' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `2px solid ${isActive ? lvl.color : 'transparent'}` }}>
                      {isLocked ? '🔒' : isPassed ? '✅' : lvl.label.split(' ')[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? lvl.color : 'var(--text-primary)' }}>{lvl.label}</span>
                        {isActive && <span style={{ fontSize: 9, background: lvl.color, color: '#000', borderRadius: 20, padding: '1px 8px', fontWeight: 700, letterSpacing: '0.05em' }}>YOU ARE HERE</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: lvl.color }}>{lvl.minDays === lvl.maxDays ? `Day ${lvl.minDays}` : lvl.maxDays === Infinity ? `${lvl.minDays}+ days` : `${lvl.minDays}–${lvl.maxDays} days`}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{lvl.auraPerDay} aura/day</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Benefits ── */}
        <button onClick={() => setExpandedSection(s => s === 'benefits' ? '' : 'benefits')} style={sectionBtn('benefits')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Star size={15} color="var(--amber)" /> Benefits at Your Level ({currentLevel.label.split(' ').slice(1).join(' ')})</span>
          {expandedSection === 'benefits' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {expandedSection === 'benefits' && (
          <div style={{ ...card, marginBottom: 12 }}>
            {BENEFITS[currentLevel.id] ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BENEFITS[currentLevel.id].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <CheckCircle2 size={15} color={currentLevel.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{b.replace('• ', '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keep going — benefits kick in after Day 1!</div>
            )}
            <div style={{ marginTop: 14, padding: '12px 14px', background: `${currentLevel.color}10`, borderRadius: 8, border: `1px solid ${currentLevel.color}33`, fontSize: 12, color: currentLevel.color, fontStyle: 'italic' }}>
              💡 These are benefits reported by thousands of people on the NoFap journey at your level.
            </div>
          </div>
        )}

        {/* ── Challenges ── */}
        <button onClick={() => setExpandedSection(s => s === 'challenges' ? '' : 'challenges')} style={sectionBtn('challenges')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Flame size={15} color="#ff4500" /> Challenges</span>
          {expandedSection === 'challenges' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {expandedSection === 'challenges' && (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {CHALLENGES.map(ch => {
                const isActive = data?.activeChallenge === ch.id
                const isComplete = isActive && streakDays >= ch.duration
                return (
                  <div key={ch.id} onClick={() => setChallenge(isActive ? '' : ch.id)}
                    className="fapless-card"
                    style={{
                      background: isActive ? 'rgba(255,69,0,0.1)' : 'var(--bg-glass)',
                      border: `1px solid ${isActive ? '#ff4500' : 'var(--border)'}`,
                      borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#ff4500' : 'var(--text-primary)' }}>{ch.label}</span>
                      {isActive && (isComplete
                        ? <span style={{ fontSize: 10, background: 'var(--green)', color: '#000', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>COMPLETE ✅</span>
                        : <span style={{ fontSize: 10, background: '#ff4500', color: '#fff', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>ACTIVE</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{ch.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.duration} days</span>
                      <span style={{ fontSize: 11, color: '#ffd700', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>⚡ +{ch.auraBonus.toLocaleString()} bonus</span>
                    </div>
                    {isActive && !isComplete && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.round((streakDays / ch.duration) * 100))}%`, background: 'linear-gradient(90deg, #ff4500, #ffd700)', borderRadius: 2, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{Math.min(100, Math.round((streakDays / ch.duration) * 100))}% — {ch.duration - streakDays} days left</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Suggestions ── */}
        <button onClick={() => setExpandedSection(s => s === 'suggestions' ? '' : 'suggestions')} style={sectionBtn('suggestions')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lightbulb size={15} color="var(--cyan)" /> Anti-Relapse Arsenal — Tools & Settings</span>
          {expandedSection === 'suggestions' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {expandedSection === 'suggestions' && (
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => setActiveSuggCat(i)}
                  style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${activeSuggCat === i ? s.color : 'var(--border)'}`, background: activeSuggCat === i ? s.color + '22' : 'transparent', color: activeSuggCat === i ? s.color : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {s.cat}
                </button>
              ))}
            </div>
            {(() => {
              const sg = SUGGESTIONS[activeSuggCat]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sg.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 10, border: `1px solid var(--border)` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: sg.color + '22', border: `1px solid ${sg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <sg.icon size={16} color={sg.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Relapse History ── */}
        {data?.relapses?.length > 0 && (
          <>
            <button onClick={() => setExpandedSection(s => s === 'history' ? '' : 'history')} style={sectionBtn('history')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={15} color="var(--text-muted)" /> Relapse History ({data.relapses.length})</span>
              {expandedSection === 'history' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {expandedSection === 'history' && (
              <div style={{ ...card, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...data.relapses].reverse().map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: 'rgba(255,71,87,0.05)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.15)' }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>
                        {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{r.reason || '—'}</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 700 }}>Day {r.dayCount}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Daily Motivation ── */}
        <div className="" style={{ ...card, background: `linear-gradient(135deg, var(--bg-card), ${currentLevel.color}08)`, border: `1px solid ${currentLevel.color}33` }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 12 }}>TODAY'S REMINDER</div>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
            {MOTIVATIONAL[Math.floor((streakDays + new Date().getDate()) % MOTIVATIONAL.length)]}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={13} color={currentLevel.color} />
            <span style={{ fontSize: 12, color: currentLevel.color, fontWeight: 600 }}>Keep your streak alive. Every day counts.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
