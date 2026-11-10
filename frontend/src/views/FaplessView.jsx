import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Flame, Shield, Trophy, RotateCcw, Zap, Star,
  ChevronDown, ChevronUp, Lightbulb,
  Smartphone, Monitor, Globe, Lock, Play, Calendar, RefreshCw,
  Waves, Wind, Dumbbell, Droplets, Phone, HeartPulse, Brain,
  X, Check, Siren, Moon, Battery, Coffee, Users, TrendingUp
} from 'lucide-react'
import { faplessAPI } from '../api/client'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { MFRing } from '../components/MFCharts'

/* ═══════════════════════════════════════════════════════════════
   FAPLESS — research-based redesign (v2.1)

   Evidence baked into this screen:
   • Urge surfing (Marlatt): urges crest & pass like waves (~15–30 min)
   • HALT trigger check (recovery standard)
   • Physiological sigh / paced breathing for acute craving
   • Behavioural replacement + environment design
   • Self-compassion over shame (abstinence violation effect)
   • Mastery experiences (Bandura): every resisted urge builds
     self-efficacy and earns aura
═══════════════════════════════════════════════════════════════ */

// ─── LEVEL SYSTEM (ids kept in sync with backend utils/aura.js) ─────────────
const LEVELS = [
  { id: 'clown',        label: 'Day One',            minDays: 0,   maxDays: 0,    auraPerDay: 0,   color: '#a0a0a0', desc: 'Every legend starts at zero. Today is that day.', image: '/levels/clown.png' },
  { id: 'noob',         label: 'Initiate',           minDays: 1,   maxDays: 6,    auraPerDay: 10,  color: '#cd7f32', desc: 'You took the first step. Most people never do.', image: '/levels/noob.png' },
  { id: 'novice',       label: 'Novice',             minDays: 7,   maxDays: 13,   auraPerDay: 20,  color: '#8fbc8f', desc: 'One week strong. Your brain is starting to rewire.', image: '/levels/novice.png' },
  { id: 'average',      label: 'Average',            minDays: 14,  maxDays: 29,   auraPerDay: 35,  color: '#6495ed', desc: 'Two weeks. Dopamine receptors are healing.', image: '/levels/average.png' },
  { id: 'advanced',     label: 'Advanced',           minDays: 30,  maxDays: 44,   auraPerDay: 55,  color: '#9370db', desc: '30 days — the famous reboot mark. Brain fog is lifting.', image: '/levels/advanced.png' },
  { id: 'sigma',        label: 'Sigma',              minDays: 45,  maxDays: 59,   auraPerDay: 80,  color: '#00bfff', desc: '45 days. Confidence, energy, and clarity are surging.', image: '/levels/sigma.png' },
  { id: 'chad',         label: 'Chad',               minDays: 60,  maxDays: 89,   auraPerDay: 110, color: 'var(--brand-warning)', desc: '60 days. People notice the change. You are becoming.', image: '/levels/chad.png' },
  { id: 'absolute_chad',label: 'Absolute Chad',      minDays: 90,  maxDays: 119,  auraPerDay: 150, color: 'var(--brand-orange)', desc: '90-day reboot complete. This is real transformation.', image: '/levels/absolute_chad.png' },
  { id: 'gigachad',     label: 'Giga Chad',          minDays: 120, maxDays: 364,  auraPerDay: 200, color: 'var(--red)', desc: '120+ days. You operate on a different frequency.', image: '/levels/gigachad.png' },
  { id: 'abs_gigachad', label: 'Absolute Giga Chad', minDays: 365, maxDays: Infinity, auraPerDay: 365, color: '#ff00ff', desc: '365 days. You have completely transcended. A new human.', image: '/levels/abs_gigachad.png' },
]

const MILESTONES = [
  { day: 1, label: 'First Step', bonus: 50, desc: 'Complete 24 hours of self-control' },
  { day: 3, label: 'Urge Breaker', bonus: 100, desc: 'Survive the first 3 critical days' },
  { day: 7, label: 'One Week Strong', bonus: 250, desc: '7 days of discipline' },
  { day: 14, label: 'Fortnight Freedom', bonus: 500, desc: '14 days of rewiring' },
  { day: 30, label: 'Monthly Mastery', bonus: 1000, desc: '30 days of clarity' },
  { day: 45, label: 'Sigma Transcended', bonus: 1500, desc: '45 days of powerful focus' },
  { day: 60, label: 'Chad Awakening', bonus: 2000, desc: '60 days of transformation' },
  { day: 90, label: 'Full Brain Reboot', bonus: 3000, desc: '90 days — dopamine baseline reset' },
  { day: 120, label: 'Elite Focus', bonus: 5000, desc: '120 days of power' },
  { day: 180, label: 'Diamond Shield', bonus: 8000, desc: 'Half a year of pure mastery' },
  { day: 365, label: 'The Annual Ascendant', bonus: 15000, desc: '1 year of legendary commitment' },
]

const CHALLENGES = [
  { id: 'NNN',    label: '🚫 No Nut November (NNN)',   duration: 30,  desc: 'Classic November challenge. 30 days of total abstinence.', auraBonus: 500 },
  { id: 'NYR',    label: '🎆 New Year Reset (NYR)',     duration: 30,  desc: 'Start the new year with a clean slate. 30 days.', auraBonus: 500 },
  { id: '30day',  label: '📅 30-Day Challenge',         duration: 30,  desc: 'The starter challenge. Proven to rewire your brain.', auraBonus: 300 },
  { id: '90day',  label: '🔥 90-Day Reboot',            duration: 90,  desc: 'The scientifically studied reboot period. Full reset.', auraBonus: 1200 },
  { id: '180day', label: '💎 180-Day Diamond',          duration: 180, desc: 'Half a year of mastery. Legendary status incoming.', auraBonus: 3000 },
  { id: 'year',   label: '🌌 The Annual Ascension',     duration: 365, desc: 'One full year. Absolute Giga Chad territory.', auraBonus: 9999 },
  { id: 'hardmode', label: '⚔️ Hard Mode (No PMO)',   duration: 90,  desc: 'No Porn, No Masturbation, No Orgasm. The ultimate test.', auraBonus: 2000 },
]

const URGE_AURA = 15

// Daily reminders — positive & process-focused (shame-based quotes removed:
// the abstinence violation effect shows shame fuels the binge cycle)
const MOTIVATIONAL = [
  '"Every day clean is a vote for the person you want to become."',
  '"The urge will pass in minutes. The strength you build lasts years."',
  '"Discipline is choosing your future self over your present feelings."',
  '"You didn\'t come this far to only come this far."',
  '"The hardest battle is with yourself. Win it."',
  '"Your energy is sacred. Protect it."',
  '"Every wave you surf rewires the loop a little more."',
  '"Motivation follows action. Start with two minutes."',
]

// ─── SCIENCE TIMELINE (evidence-informed expectations by day range) ─────────
const BRAIN_TIMELINE = [
  { range: 'Day 1–3', title: 'Withdrawal peak', color: 'var(--red)', icon: Flame,
    body: 'Cravings, irritability and restlessness are normal — your brain is losing its easiest dopamine source. Urges feel strongest now and usually pass within 15–30 minutes.' },
  { range: 'Day 4–7', title: 'Sleep & energy return', color: 'var(--brand-orange)', icon: Battery,
    body: 'Many people notice deeper sleep and steadier morning energy. Urges are still frequent — every wave you surf weakens the habit loop a little more.' },
  { range: 'Day 8–14', title: 'Fog lifting', color: 'var(--brand-warning)', icon: Brain,
    body: 'Mental fog starts clearing and focus spans lengthen. Motivation becomes less about willpower and more about momentum.' },
  { range: 'Day 15–29', title: 'Rewiring', color: 'var(--brand-primary)', icon: TrendingUp,
    body: 'Reward sensitivity begins recovering — small everyday wins start feeling good again. Boredom is normal: your brain is relearning slower pleasures.' },
  { range: 'Day 30–44', title: 'The 30-day mark', color: 'var(--brand-secondary)', icon: Shield,
    body: 'The classic reboot milestone. Habit loops weaken noticeably; many report more eye contact, drive and social ease around now.' },
  { range: 'Day 45–89', title: 'Compounding', color: 'var(--brand-teal)', icon: Zap,
    body: 'Deep-work capacity grows and emotional reactivity drops. Discipline starts spilling over into training, work and relationships.' },
  { range: 'Day 90+', title: 'Full reboot', color: 'var(--brand-success)', icon: Trophy,
    body: 'The default loop has been rewritten. The goal now is identity: you are someone who does hard things. Keep surfing waves — they still come, but they are small.' },
]

// ─── SOS TOOLKIT ─────────────────────────────────────────────────────────────
const TRIGGERS = [
  { id: 'hungry',   label: 'Hungry',    emoji: '🍽️', tip: 'Eat something real first. Low blood sugar mimics cravings.' },
  { id: 'angry',    label: 'Angry',     emoji: '😤', tip: 'Angry needs an outlet, not a screen. Move hard for 2 minutes.' },
  { id: 'lonely',   label: 'Lonely',    emoji: '🫂', tip: 'Text or call one person right now. Connection is the antidote.' },
  { id: 'tired',    label: 'Tired',     emoji: '😴', tip: 'Willpower is lowest when tired. A 15-min nap beats a relapse.' },
  { id: 'bored',    label: 'Bored',     emoji: '🥱', tip: 'Boredom is withdrawal from stimulation. Pick anything hands-on.' },
  { id: 'stressed', label: 'Stressed',  emoji: '😩', tip: 'Breathe out slowly — longer exhales switch off the stress response.' },
  { id: 'scrolling',label: 'Late-night scroll', emoji: '📱', tip: 'Put the phone in another room. Distance beats discipline.' },
]

const REPLACEMENT_ACTIONS = [
  { id: 'pushups',  label: '20 push-ups',            icon: Dumbbell, tip: 'Channel the energy physically — the urge chemistry actually helps here.' },
  { id: 'cold',     label: 'Cold water on face',     icon: Droplets, tip: 'Triggers the dive reflex and drops heart rate fast.' },
  { id: 'walk',     label: '10-minute walk outside', icon: Wind,     tip: 'Change of scene breaks the rumination loop.' },
  { id: 'call',     label: 'Text an accountability friend', icon: Users, tip: 'Saying it out loud kills the secrecy that feeds the habit.' },
  { id: 'water',    label: 'Drink a glass of water', icon: HeartPulse, tip: 'Dehydration amplifies cravings. Simple, but it works.' },
  { id: 'breath',   label: '1 minute of slow breathing', icon: Wind, tip: 'Long, slow exhales calm the nervous system in real time.' },
]

// Compassionate reframes — replaces the old shame-based "demotivational
// quotes". Research: shame fuels the binge cycle (abstinence violation
// effect); self-compassion predicts faster re-engagement.
const REFRAMES = [
  'A relapse is a data point, not an identity. You just learned exactly which wave knocked you down.',
  'The streak reset, but the skill didn’t. You still know how to surf an urge — that stays with you.',
  'You didn’t lose the progress. You found the next edge of it.',
  'Progress isn’t a straight line — it’s a trend. Zoom out; you’re still on it.',
  'One wave, one fall. The ocean is still yours.',
]

const ENV_TOOLS = [
  {
    cat: '📱 Mobile Apps', icon: Smartphone, color: '#00bfff',
    items: [
      { name: 'BlockSite', desc: 'Block adult sites on Android & iOS with a password lock.' },
      { name: 'Cold Turkey (iOS)', desc: 'Hard block with a commitment mode — can’t be overridden.' },
      { name: 'Pluckeye', desc: 'Gradually reduces image content. Extreme mode available.' },
      { name: 'Covenant Eyes', desc: 'Accountability app — sends report to a trusted person.' },
    ]
  },
  {
    cat: '💻 PC Extensions', icon: Monitor, color: '#9370db',
    items: [
      { name: 'BlockSite (Chrome/Firefox)', desc: 'Add any site to a blocklist instantly.' },
      { name: 'Cold Turkey Blocker', desc: 'Blocks at OS level — even in incognito. Unbeatable.' },
      { name: 'uBlock Origin', desc: 'Block entire domains by adding filter rules.' },
      { name: 'LeechBlock NG (Firefox)', desc: 'Schedule blocks by time of day.' },
    ]
  },
  {
    cat: '🌐 Network & Browser', icon: Globe, color: 'var(--brand-warning)',
    items: [
      { name: 'Enable Safe Search', desc: 'Google Settings → turn on SafeSearch and lock it.' },
      { name: 'Family DNS — 1.1.1.3', desc: 'Cloudflare for Families blocks adult content at network level.' },
      { name: 'Router parental controls', desc: 'Block content for every device on your network.' },
      { name: 'Clean browser profile', desc: 'A locked-down profile for work/study, no extensions.' },
    ]
  },
  {
    cat: '🔒 System-Level', icon: Lock, color: 'var(--brand-orange)',
    items: [
      { name: 'Hosts file editing', desc: 'Add blocked domains to C:/Windows/System32/drivers/etc/hosts' },
      { name: 'OpenDNS FamilyShield', desc: '208.67.222.123 — free DNS that blocks adult content globally.' },
      { name: 'Accountability partner', desc: 'Share your streak with a trusted friend. Social pressure works.' },
      { name: 'Delete saved passwords', desc: 'Remove easy access. Friction kills urges.' },
    ]
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getLevel(days) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (days >= LEVELS[i].minDays) return LEVELS[i]
  }
  return LEVELS[0]
}

function getNextLevel(days) {
  for (const lvl of LEVELS) {
    if (days < lvl.minDays) return lvl
  }
  return null
}

// Mirrors backend utils/aura.js — each day counted once, by its level range.
function calcAura(days) {
  let aura = 0
  for (const lvl of LEVELS) {
    if (lvl.auraPerDay <= 0) continue
    const levelStart = Math.max(lvl.minDays, 1)
    const levelEnd = lvl.maxDays === Infinity ? days : Math.min(days, lvl.maxDays)
    const daysInLevel = levelEnd - levelStart + 1
    if (daysInLevel > 0) aura += daysInLevel * lvl.auraPerDay
  }
  return aura
}

const calcMilestoneAura = (days) => MILESTONES.filter(m => days >= m.day).reduce((s, m) => s + m.bonus, 0)
const getCompletedMilestones = (days) => MILESTONES.filter(m => days >= m.day)

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const pad = (n) => String(n).padStart(2, '0')

/* ═══════════════════════════════════════════════════════════════
   SOS OVERLAY — urge-surfing intervention
═══════════════════════════════════════════════════════════════ */
function SOSOverlay({ streakDays, onClose, onSurfed, onRelapse }) {
  const SURF_SECONDS = 180
  const [remaining, setRemaining] = useState(SURF_SECONDS)
  const [running, setRunning] = useState(true)
  const [intensity, setIntensity] = useState(7)
  const [trigger, setTrigger] = useState('')
  const [doneActions, setDoneActions] = useState([])
  const [breathPhase, setBreathPhase] = useState(0) // cycles 0..3 (in/hold/out/hold)
  const [phaseLeft, setPhaseLeft] = useState(4)
  const [logging, setLogging] = useState(false)

  // Surf timer
  useEffect(() => {
    if (!running || remaining <= 0) return
    const t = setInterval(() => setRemaining(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [running, remaining])

  // Breathing pacer — box breathing 4-4-4-4
  useEffect(() => {
    const t = setInterval(() => {
      setPhaseLeft(l => {
        if (l <= 1) { setBreathPhase(p => (p + 1) % 4); return 4 }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const surfPct = ((SURF_SECONDS - remaining) / SURF_SECONDS) * 100
  const breathLabels = ['Breathe in', 'Hold', 'Breathe out', 'Hold']
  const breathScales = [1, 1, 0.55, 0.55]
  const triggerMeta = TRIGGERS.find(t => t.id === trigger)

  const finishSurf = async () => {
    setLogging(true)
    try {
      const res = await faplessAPI.urgeLog({
        trigger,
        intensityBefore: intensity,
        intensityAfter: Math.max(0, intensity - 4),
        strategy: doneActions.join(',') || 'surf',
        resisted: true,
      })
      onSurfed(res)
    } catch (e) {
      onSurfed(null, e)
    } finally { setLogging(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'var(--bg-overlay)', backdropFilter: 'saturate(180%) blur(28px)', WebkitBackdropFilter: 'saturate(180%) blur(28px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'auto', padding: '24px 20px 48px',
      animation: 'sosIn 0.35s var(--ease-out-expo) forwards',
    }}>
      <style>{`
        @keyframes sosIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes breathe {
          0%,100% { transform: scale(0.55) }
          25% { transform: scale(1) }
          50% { transform: scale(1) }
          75% { transform: scale(0.55) }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-primary)' }}>
          <Siren size={18} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em' }}>URGE RESCUE</span>
        </div>
        <button onClick={onClose} aria-label="Close rescue"
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={17} />
        </button>
      </div>

      {/* Surf card */}
      <div style={{ width: '100%', maxWidth: 640, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: 4 }}>
          <Waves size={14} color="var(--brand-primary)" /> URGE SURFING
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
          An urge is a wave — it peaks, crests, and passes. Ride this timer with slow breathing and it will drop on its own.
        </div>

        {/* Breathing circle + timer */}
        <div style={{ position: 'relative', width: 168, height: 168, margin: '0 auto 8px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--brand-primary-dim) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 128, height: 128, marginLeft: -64, marginTop: -64,
            borderRadius: '50%', border: '2px solid var(--brand-primary)', opacity: 0.35,
            animation: 'breathe 16s var(--ease-in-out) infinite',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 108, height: 108, marginLeft: -54, marginTop: -54,
            borderRadius: '50%', border: '2px solid var(--brand-primary)',
            animation: 'breathe 16s var(--ease-in-out) infinite',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-elevated)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {mm}:{pad(ss)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--brand-primary)', marginTop: 2 }}>
              {breathLabels[breathPhase]} · {phaseLeft}
            </span>
          </div>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', maxWidth: 320, margin: '14px auto 0' }}>
          <div style={{ height: '100%', width: `${surfPct}%`, background: 'var(--brand-primary)', borderRadius: 3, transition: 'width 1s linear' }} />
        </div>
        <button onClick={() => setRunning(r => !r)}
          style={{ marginTop: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)', padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', minHeight: 34 }}>
          {remaining === 0 ? 'Wave passed ✓' : running ? 'Pause timer' : 'Resume timer'}
        </button>
      </div>

      {/* Trigger check (HALT) */}
      <div style={{ width: '100%', maxWidth: 640, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px 22px', marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 4 }}>WHAT'S DRIVING THIS?</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Name it to tame it — most urges trace back to one of these.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRIGGERS.map(t => {
            const on = trigger === t.id
            return (
              <button key={t.id} onClick={() => setTrigger(on ? '' : t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 38,
                  border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: on ? 'var(--brand-primary-dim)' : 'transparent',
                  color: on ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            )
          })}
        </div>
        {triggerMeta && (
          <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 10, background: 'var(--brand-primary-dim)', border: '1px solid var(--brand-primary-glow)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, display: 'flex', gap: 8 }}>
            <Lightbulb size={15} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            {triggerMeta.tip}
          </div>
        )}

        {/* Intensity slider */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span>How strong is the urge?</span>
            <span style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{intensity}/10</span>
          </div>
          <input type="range" min="0" max="10" value={intensity} onChange={e => setIntensity(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand-primary)', height: 28 }} />
        </div>
      </div>

      {/* Replacement actions */}
      <div style={{ width: '100%', maxWidth: 640, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px 22px', marginTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 4 }}>CHANGE THE CHANNEL</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Do one or two — physical state changes beat willpower.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {REPLACEMENT_ACTIONS.map(a => {
            const on = doneActions.includes(a.id)
            return (
              <button key={a.id} onClick={() => setDoneActions(prev => on ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                title={a.tip}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 'var(--radius-pill)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 38,
                  border: `1px solid ${on ? 'var(--brand-success)' : 'var(--border)'}`,
                  background: on ? 'var(--green-dim)' : 'transparent',
                  color: on ? 'var(--brand-success)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                <a.icon size={14} /> {on ? <Check size={12} /> : null} {a.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        <button onClick={finishSurf} disabled={logging}
          style={{ background: 'var(--brand-success)', border: 'none', borderRadius: 14, color: '#fff', padding: '15px 24px', fontSize: 15.5, fontWeight: 700, cursor: logging ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, opacity: logging ? 0.7 : 1 }}>
          {logging ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Waves size={17} />}
          {logging ? 'Logging…' : `I surfed it — log the win (+${URGE_AURA} aura)`}
        </button>
        <button onClick={onRelapse}
          style={{ background: 'none', border: 'none', borderRadius: 10, color: 'var(--text-muted)', padding: '10px', fontSize: 13, cursor: 'pointer', minHeight: 40, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          It happened — log it honestly (no shame, just data)
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN VIEW
═══════════════════════════════════════════════════════════════ */
export default function FaplessView() {
  const isMobile = useIsMobile()
  const toast = useToast()
  const confirmDialog = useConfirm()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showSOS, setShowSOS] = useState(false)
  const [showRelapse, setShowRelapse] = useState(false)
  const [relapseTrigger, setRelapseTrigger] = useState('')
  const [relapseNote, setRelapseNote] = useState('')
  const [reframe, setReframe] = useState(null) // post-relapse reframe screen

  const [expandedSection, setExpandedSection] = useState('science')
  const [activeSuggCat, setActiveSuggCat] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    faplessAPI.get()
      .then(res => setData(res.data))
      .catch(() => toast.error('Could not load your streak. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // live clock
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const totalMs = data?.startDate ? now - new Date(data.startDate).getTime() : 0
  const streakDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const streakHrs  = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const streakMins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const streakSecs = Math.floor((totalMs % (1000 * 60)) / 1000)

  const currentLevel = getLevel(streakDays)
  const nextLevel = getNextLevel(streakDays)
  const progressToNext = nextLevel
    ? Math.min(100, Math.round(((streakDays - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100))
    : 100

  // ── Analytics ──
  const analytics = useMemo(() => {
    const urges = data?.urgeLogs || []
    const relapses = data?.relapses || []
    const resisted = urges.filter(u => u.resisted)
    const avgDrop = resisted.length
      ? Math.round((resisted.reduce((s, u) => s + Math.max(0, (u.intensityBefore || 0) - (u.intensityAfter || 0)), 0) / resisted.length) * 10) / 10
      : null
    const triggerMap = {}
    urges.forEach(u => { if (u.trigger) triggerMap[u.trigger] = (triggerMap[u.trigger] || 0) + 1 })
    relapses.forEach(r => { if (r.trigger) triggerMap[r.trigger] = (triggerMap[r.trigger] || 0) + 1 })
    const topTriggers = Object.entries(triggerMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => {
      const t = TRIGGERS.find(x => x.id === k)
      return t ? t.label : k
    })
    const bestStreak = Math.max(streakDays, ...relapses.map(r => r.dayCount || 0), 0)
    return {
      urgesTotal: urges.length,
      resistedCount: resisted.length,
      successRate: urges.length ? Math.round((resisted.length / urges.length) * 100) : null,
      avgDrop,
      topTriggers,
      bestStreak,
      comebacks: relapses.length,
    }
  }, [data, streakDays])

  const nextMilestone = MILESTONES.find(m => m.day > streakDays)
  const milestonePct = nextMilestone
    ? Math.min(100, Math.round((streakDays / nextMilestone.day) * 100))
    : 100

  const streakAura = calcAura(streakDays)
  const milestoneAura = calcMilestoneAura(streakDays)
  const urgeAura = analytics.resistedCount * URGE_AURA
  let challengeBonus = 0
  if (data?.activeChallenge) {
    const ch = CHALLENGES.find(c => c.id === data.activeChallenge)
    if (ch && streakDays >= ch.duration) challengeBonus = ch.auraBonus
  }
  challengeBonus += (data?.relapses?.reduce((acc, r) => acc + (r.bonusEarned || 0), 0) || 0)
  const auraPoints = streakAura + milestoneAura + urgeAura + challengeBonus

  // ── Actions ──
  const handleStart = async () => {
    if (data?.startDate) {
      const ok = await confirmDialog({
        title: 'Start a fresh streak?',
        body: 'Your current streak will be reset to zero from today. Milestone history stays.',
        confirmLabel: 'Reset streak', danger: true,
      })
      if (!ok) return
    }
    setSaving(true)
    try {
      const res = await faplessAPI.start()
      setData(res.data)
      toast.success('Day 1. Let’s go.')
    } catch (e) {
      toast.error(e.message || 'Could not start the streak.')
    } finally { setSaving(false) }
  }

  const handleRelapse = async () => {
    setSaving(true)
    try {
      const res = await faplessAPI.relapse(relapseNote.trim(), streakDays, relapseTrigger)
      setData(res.data)
      setShowRelapse(false)
      setShowSOS(false)
      setRelapseTrigger('')
      setRelapseNote('')
      setReframe(REFRAMES[Math.floor(Math.random() * REFRAMES.length)])
    } catch (e) {
      toast.error(e.message || 'Could not log the relapse.')
    } finally { setSaving(false) }
  }

  const handleSurfed = (res, err) => {
    if (err) { toast.error(err.message || 'Could not log the urge.'); return }
    if (res?.data) setData(res.data)
    setShowSOS(false)
    toast.success(`Urge surfed. +${URGE_AURA} aura.`)
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
      toast.success(id ? 'Challenge activated.' : 'Challenge cleared.')
    } catch (e) {
      toast.error(e.message || 'Could not update the challenge.')
    } finally { setSaving(false) }
  }

  // ── Styles ──
  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: 10, flexDirection: 'column' }}>
      <Flame size={36} color="var(--red)" style={{ animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ fontSize: 14 }}>Loading Fapless…</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} } @keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Post-relapse reframe screen (compassionate, data-first) ──
  if (reframe) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 22, padding: 40 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Waves size={34} color="var(--brand-success)" />
      </div>
      <div style={{ maxWidth: 520, textAlign: 'center', fontSize: isMobile ? 17 : 20, fontWeight: 600, lineHeight: 1.55, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {reframe}
      </div>
      <div style={{ display: 'flex', gap: 26, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['Best streak', `${analytics.bestStreak}d`, 'var(--brand-success)'],
          ['Urges resisted', analytics.resistedCount, 'var(--brand-primary)'],
          ['Comebacks', analytics.comebacks, 'var(--text-secondary)']].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: c, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 420 }}>
        Your trigger was saved. Spotting patterns early is how future waves get smaller.
      </div>
      <button onClick={() => { setReframe(null); load() }}
        style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 14, color: '#fff', padding: '14px 30px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 50, boxShadow: 'var(--shadow-brand)' }}>
        <RefreshCw size={16} /> Start Fresh
      </button>
    </div>
  )

  /* Shared fragments */
  const statsRow = (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
      {[
        { label: 'BEST STREAK', value: `${analytics.bestStreak}d`, color: 'var(--brand-success)', icon: Trophy },
        { label: 'URGES RESISTED', value: analytics.resistedCount, color: 'var(--brand-primary)', icon: Waves },
        { label: 'WAVE SUCCESS', value: analytics.successRate === null ? '—' : `${analytics.successRate}%`, color: 'var(--brand-teal)', icon: TrendingUp },
        { label: 'COMEBACKS', value: analytics.comebacks, color: 'var(--text-secondary)', icon: RotateCcw },
      ].map(s => (
        <div key={s.label} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <s.icon size={13} color={s.color} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
        </div>
      ))}
    </div>
  )

  const scienceSection = (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
      {BRAIN_TIMELINE.map(t => {
        const active = streakDays >= 0 && (() => {
          const m = t.range.match(/(\d+)[–-](\d+)?/)
          if (!m) return false
          const from = Number(m[1])
          const to = m[2] ? Number(m[2]) : Infinity
          return streakDays + 1 >= from && streakDays + 1 <= to
        })()
        return (
          <div key={t.range} style={{
            border: `1px solid ${active ? t.color : 'var(--border)'}`,
            background: active ? `color-mix(in srgb, ${t.color} 6%, transparent)` : 'var(--bg-glass)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <t.icon size={15} color={t.color} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? t.color : 'var(--text-primary)' }}>{t.title}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{t.range}</span>
              {active && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: t.color, borderRadius: 20, padding: '2px 8px' }}>NOW</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.body}</div>
          </div>
        )
      })}
    </div>
  )

  const levelsSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {LEVELS.map(lvl => {
        const isActive = lvl.id === currentLevel.id
        const isLocked = streakDays < lvl.minDays
        return (
          <div key={lvl.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            borderRadius: 12, border: `1px solid ${isActive ? lvl.color : 'var(--border)'}`,
            background: isActive ? `color-mix(in srgb, ${lvl.color} 8%, transparent)` : 'var(--bg-glass)',
            opacity: isLocked ? 0.45 : 1, transition: 'all 0.15s',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', border: `2px solid ${isActive ? lvl.color : 'var(--border)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
              {isLocked ? <Lock size={14} color="var(--text-muted)" /> : <img src={lvl.image} alt={lvl.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? lvl.color : 'var(--text-primary)' }}>{lvl.label}</span>
                {isActive && <span style={{ fontSize: 9, background: lvl.color, color: '#000', borderRadius: 20, padding: '1px 8px', fontWeight: 800, letterSpacing: '0.05em' }}>YOU ARE HERE</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lvl.desc}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: lvl.color }}>
                {lvl.minDays === lvl.maxDays ? 'Day 0' : lvl.maxDays === Infinity ? `${lvl.minDays}+ days` : `${lvl.minDays}–${lvl.maxDays}d`}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{lvl.auraPerDay} aura/day</div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const milestonesSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {MILESTONES.map(m => {
        const isCompleted = streakDays >= m.day
        const isNext = nextMilestone?.day === m.day
        return (
          <div key={m.day} style={{
            padding: '12px 14px', borderRadius: 12,
            background: isCompleted ? 'var(--green-dim)' : 'var(--bg-glass)',
            border: `1px solid ${isCompleted ? 'var(--brand-success)' : isNext ? 'var(--brand-primary-glow)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: isCompleted ? 'var(--brand-success)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isCompleted ? '#000' : 'var(--text-muted)', fontSize: 11, fontWeight: 800,
            }}>
              {isCompleted ? <Check size={15} color="#000" /> : `${m.day}d`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: isCompleted ? 'var(--brand-success)' : 'var(--text-primary)' }}>{m.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
              {isNext && (
                <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${milestonePct}%`, background: 'var(--brand-primary)', borderRadius: 2, transition: 'width 0.6s var(--ease-out-expo)' }} />
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--brand-warning)', fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>+{m.bonus}</div>
          </div>
        )
      })}
    </div>
  )

  const challengesSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CHALLENGES.map(ch => {
        const isActive = data?.activeChallenge === ch.id
        const isComplete = isActive && streakDays >= ch.duration
        return (
          <div key={ch.id} onClick={() => setChallenge(isActive ? '' : ch.id)} style={{
            padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
            background: isActive ? 'var(--red-dim)' : 'var(--bg-glass)',
            border: `1px solid ${isActive ? 'var(--brand-error)' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? 'var(--brand-error)' : 'var(--text-primary)' }}>{ch.label}</span>
              {isActive && <span style={{ fontSize: 9, background: isComplete ? 'var(--brand-success)' : 'var(--brand-error)', color: isComplete ? '#000' : '#fff', borderRadius: 20, padding: '2px 8px', fontWeight: 800, flexShrink: 0 }}>{isComplete ? 'DONE ✓' : 'ACTIVE'}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{ch.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.duration} days</span>
              <span style={{ fontSize: 11, color: 'var(--brand-warning)', fontWeight: 700 }}>⚡ +{ch.auraBonus.toLocaleString()}</span>
            </div>
            {isActive && !isComplete && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.round((streakDays / ch.duration) * 100))}%`, background: 'linear-gradient(90deg,var(--red),var(--brand-warning))', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{Math.max(0, ch.duration - streakDays)} days left</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const envToolsSection = (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 4 }}>
        {ENV_TOOLS.map((s, i) => (
          <button key={i} onClick={() => setActiveSuggCat(i)} style={{ padding: '7px 13px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, minHeight: 34, border: `1px solid ${activeSuggCat === i ? s.color : 'var(--border)'}`, background: activeSuggCat === i ? `color-mix(in srgb, ${s.color} 14%, transparent)` : 'transparent', color: activeSuggCat === i ? s.color : 'var(--text-muted)', transition: 'all 0.15s' }}>
            {s.cat.split(' ')[0]}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        Environment design beats willpower — make the habit harder to start than to stop.
      </div>
      {(() => {
        const sg = ENV_TOOLS[activeSuggCat]
        return sg.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < sg.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, ${sg.color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <sg.icon size={16} color={sg.color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))
      })()}
    </div>
  )

  const historySection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Urge log */}
      {data?.urgeLogs?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>URGE LOG — {analytics.resistedCount}/{data.urgeLogs.length} SURFED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...data.urgeLogs].reverse().slice(0, 12).map((u, i) => {
              const t = TRIGGERS.find(x => x.id === u.trigger)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 15 }}>{t?.emoji || '🌊'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t?.label || 'Urge'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{new Date(u.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · intensity {u.intensityBefore ?? '–'}→{u.intensityAfter ?? '–'}</div>
                  </div>
                  {u.resisted && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-success)', background: 'var(--green-dim)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>SURFED +{URGE_AURA}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Relapses */}
      {data?.relapses?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>RELAPSE HISTORY — {data.relapses.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...data.relapses].reverse().map((r, i) => {
              const t = TRIGGERS.find(x => x.id === r.trigger)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 15 }}>{t?.emoji || '🌀'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{t?.label || r.reason || 'Not specified'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}{r.reason ? ` · ${r.reason}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--brand-orange)', fontWeight: 700, flexShrink: 0 }}>Day {r.dayCount}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {!data?.urgeLogs?.length && !data?.relapses?.length && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '18px 0' }}>
          Nothing here yet. Every urge you surf or log builds the picture.
        </div>
      )}
    </div>
  )

  /* ── Collapsible section wrapper ── */
  const Section = ({ id, icon: Icon, title, hint, color, children }) => {
    const open = expandedSection === id
    return (
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <button onClick={() => setExpandedSection(s => s === id ? '' : id)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', minHeight: 52, textAlign: 'left' }}>
          <Icon size={17} color={color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
            {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{hint}</div>}
          </div>
          {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </button>
        {open && <div style={{ padding: '4px 20px 20px' }}>{children}</div>}
      </div>
    )
  }

  /* ═══ MOBILE ═══ */
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
          @keyframes auraFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
          .fapless-scroll > * { flex-shrink: 0; }
        `}</style>

        {/* Sticky aura header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={15} color="var(--brand-warning)" fill="var(--brand-warning)" />
            <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--brand-warning)', letterSpacing: '-0.5px' }}>
              {auraPoints.toLocaleString()}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.06em' }}>AURA</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-warning)', background: 'color-mix(in srgb, var(--brand-warning) 12%, transparent)', padding: '4px 10px', borderRadius: 20 }}>
            +{currentLevel.auraPerDay}/DAY
          </div>
        </div>

        <div className="fapless-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 14px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hero */}
          <div style={{ background: `linear-gradient(160deg, var(--bg-card), color-mix(in srgb, ${currentLevel.color} 7%, transparent))`, border: `1px solid color-mix(in srgb, ${currentLevel.color} 30%, transparent)`, borderRadius: 'var(--radius-xl)', padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 58, height: 58, borderRadius: 14, overflow: 'hidden', border: `2px solid ${currentLevel.color}`, flexShrink: 0, background: 'var(--bg-base)' }}>
                <img src={currentLevel.image} alt={currentLevel.label} onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>CURRENT STREAK</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 46, fontWeight: 800, fontFamily: 'var(--font-display)', color: currentLevel.color, lineHeight: 1.05, letterSpacing: '-0.03em', animation: 'auraFloat 5s ease-in-out infinite' }}>{streakDays}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>days</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {pad(streakHrs)}:{pad(streakMins)}:{pad(streakSecs)} · {currentLevel.label}
                </div>
              </div>
              <MFRing percent={milestonePct} size={54} stroke={6} color={currentLevel.color} track="var(--border)" label={nextMilestone ? `${nextMilestone.day}d` : 'MAX'} />
            </div>
            {nextLevel && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Next: {nextLevel.label}</span>
                  <span style={{ color: currentLevel.color, fontWeight: 700 }}>{nextLevel.minDays - streakDays}d to go</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${progressToNext}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`, borderRadius: 3, transition: 'width 0.8s var(--ease-out-expo)' }} />
                </div>
              </div>
            )}
          </div>

          {/* SOS band — always one tap away */}
          <button onClick={() => setShowSOS(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              background: 'linear-gradient(120deg, var(--red-dim), color-mix(in srgb, var(--brand-orange) 8%, transparent))',
              border: '1px solid color-mix(in srgb, var(--brand-error) 35%, transparent)',
              borderRadius: 'var(--radius-xl)', padding: '15px 16px', cursor: 'pointer', minHeight: 72,
              transition: 'transform 0.15s var(--ease-apple)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.008)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 18px rgba(255,69,58,0.35)' }}>
              <Siren size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Urge hitting right now?</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Open Urge Rescue — surf the wave in 3 minutes</div>
            </div>
            <ChevronUp size={16} color="var(--text-muted)" style={{ transform: 'rotate(90deg)' }} />
          </button>

          {statsRow}

          {!data?.startDate && (
            <button onClick={handleStart} disabled={saving}
              style={{ background: 'var(--brand-error)', border: 'none', borderRadius: 14, color: '#fff', padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52 }}>
              <Play size={17} /> Start Journey
            </button>
          )}

          <Section id="science" icon={Brain} title="Your brain on Day N" hint="What to expect, day by day" color="var(--brand-secondary)">{scienceSection}</Section>
          <Section id="levels" icon={Trophy} title="Level roadmap" hint={currentLevel.label} color="var(--brand-warning)">{levelsSection}</Section>
          <Section id="milestones" icon={Star} title="Milestones" hint={`${getCompletedMilestones(streakDays).length}/${MILESTONES.length} earned`} color="var(--brand-warning)">{milestonesSection}</Section>
          <Section id="challenges" icon={Flame} title="Challenges" hint={data?.activeChallenge ? CHALLENGES.find(c => c.id === data.activeChallenge)?.label : 'Pick a run to commit to'} color="var(--brand-error)">{challengesSection}</Section>
          <Section id="tools" icon={Lightbulb} title="Environment design" hint="Blockers & friction tools" color="var(--brand-primary)">{envToolsSection}</Section>
          <Section id="history" icon={Calendar} title="History" hint="Urge log & relapses" color="var(--text-muted)">{historySection}</Section>

          {/* Daily reminder */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>TODAY'S REMINDER</div>
            <div style={{ fontSize: 14.5, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.65, fontWeight: 500 }}>
              {MOTIVATIONAL[Math.floor((streakDays + new Date().getDate()) % MOTIVATIONAL.length)]}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} color={currentLevel.color} />
              <span style={{ fontSize: 11, color: currentLevel.color, fontWeight: 600 }}>Every wave you surf makes the next one smaller.</span>
            </div>
          </div>
        </div>

        {showSOS && (
          <SOSOverlay
            streakDays={streakDays}
            onClose={() => setShowSOS(false)}
            onSurfed={handleSurfed}
            onRelapse={() => { setShowSOS(false); setShowRelapse(true) }}
          />
        )}

        {showRelapse && (
          <RelapsePanel
            isMobile={true}
            streakDays={streakDays}
            trigger={relapseTrigger} setTrigger={setRelapseTrigger}
            note={relapseNote} setNote={setRelapseNote}
            onConfirm={handleRelapse}
            onCancel={() => setShowRelapse(false)}
            saving={saving}
          />
        )}
      </div>
    )
  }

  /* ═══ DESKTOP ═══ */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
        @keyframes auraFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .fapless-scroll > * { flex-shrink: 0; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--brand-error)', fontWeight: 700, letterSpacing: '0.18em', marginBottom: 4 }}>FAPLESS · DISCIPLINE ENGINE</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Mastery Journey</h1>
          </div>
          {data?.startDate && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRelapse(s => !s)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)', padding: '10px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <RotateCcw size={14} /> Log relapse
              </button>
              <button onClick={handleStart} disabled={saving}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', color: 'var(--text-muted)', padding: '10px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, minHeight: 44 }}>
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scroll area */}
      <div className="fapless-scroll" style={{ flex: 1, overflow: 'auto', padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero row */}
        <div className="grid-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {/* Streak */}
          <div style={{ ...card, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, background: `linear-gradient(160deg, var(--bg-card), color-mix(in srgb, ${currentLevel.color} 7%, transparent))`, border: `1px solid color-mix(in srgb, ${currentLevel.color} 28%, transparent)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', fontWeight: 700 }}>CURRENT STREAK</span>
              <MFRing percent={milestonePct} size={46} stroke={5} color={currentLevel.color} track="var(--border)" label={nextMilestone ? `${nextMilestone.day}d` : 'MAX'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 68, fontWeight: 800, fontFamily: 'var(--font-display)', color: currentLevel.color, lineHeight: 1, letterSpacing: '-0.04em', animation: 'auraFloat 5s ease-in-out infinite' }}>{streakDays}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{streakDays === 1 ? 'day clean' : 'days clean'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pad(streakHrs)}:{pad(streakMins)}:{pad(streakSecs)}</div>
              </div>
            </div>
            {nextLevel ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Next: {nextLevel.label}</span>
                  <span style={{ color: currentLevel.color, fontWeight: 700 }}>{nextLevel.minDays - streakDays}d to go</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${progressToNext}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`, borderRadius: 3, transition: 'width 0.8s var(--ease-out-expo)' }} />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--brand-warning)', fontWeight: 700 }}>🏆 ASCENDED — MAX LEVEL</div>
            )}
          </div>

          {/* Level / identity */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, background: `linear-gradient(160deg, var(--bg-card), color-mix(in srgb, ${currentLevel.color} 9%, transparent))`, border: `1px solid color-mix(in srgb, ${currentLevel.color} 30%, transparent)` }}>
            <div style={{ width: 104, height: 104, borderRadius: 18, overflow: 'hidden', border: `2px solid ${currentLevel.color}`, flexShrink: 0, background: 'var(--bg-base)', boxShadow: `0 8px 28px color-mix(in srgb, ${currentLevel.color} 25%, transparent)` }}>
              <img src={currentLevel.image} alt={currentLevel.label} onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 6 }}>CURRENT IDENTITY</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: currentLevel.color, marginBottom: 6, letterSpacing: '-0.02em' }}>{currentLevel.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{currentLevel.desc}</div>
            </div>
          </div>

          {/* Strength / aura */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.16em', fontWeight: 700 }}>DISCIPLINE ENERGY</span>
              <Zap size={14} color="var(--brand-warning)" fill="var(--brand-warning)" />
            </div>
            <div style={{ fontSize: 46, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--brand-warning)', lineHeight: 1, letterSpacing: '-0.03em' }}>{auraPoints.toLocaleString()}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[['Streak', streakAura], ['Milestones', milestoneAura], ['Urge wins', urgeAura], ['Challenges', challengeBonus]].map(([l, v]) => (
                <span key={l} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px' }}>
                  {l} · {v.toLocaleString()}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto' }}>
              +{currentLevel.auraPerDay} per day · +{URGE_AURA} per surfed urge
            </div>
          </div>
        </div>

        {/* SOS band */}
        <button onClick={() => setShowSOS(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left',
            background: 'linear-gradient(120deg, var(--red-dim), color-mix(in srgb, var(--brand-orange) 7%, transparent))',
            border: '1px solid color-mix(in srgb, var(--brand-error) 32%, transparent)',
            borderRadius: 'var(--radius-xl)', padding: '16px 20px', cursor: 'pointer', minHeight: 76,
            transition: 'transform 0.15s var(--ease-apple), border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.005)'; e.currentTarget.style.borderColor = 'var(--brand-error)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--brand-error) 32%, transparent)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 22px rgba(255,69,58,0.4)' }}>
            <Siren size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Urge hitting right now?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Open Urge Rescue — a guided 3-minute wave: breathe, check your state, change the channel. Surfing one earns +{URGE_AURA} aura.
            </div>
          </div>
          <ChevronUp size={18} color="var(--text-muted)" style={{ transform: 'rotate(90deg)', flexShrink: 0 }} />
        </button>

        {!data?.startDate && (
          <button onClick={handleStart} disabled={saving}
            style={{ background: 'var(--brand-error)', border: 'none', borderRadius: 14, color: '#fff', padding: '16px', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 54 }}>
            <Play size={18} /> Start Journey
          </button>
        )}

        {statsRow}

        {/* Relapse panel (structured debrief) */}
        {showRelapse && (
          <RelapsePanel
            isMobile={false}
            streakDays={streakDays}
            trigger={relapseTrigger} setTrigger={setRelapseTrigger}
            note={relapseNote} setNote={setRelapseNote}
            onConfirm={handleRelapse}
            onCancel={() => setShowRelapse(false)}
            saving={saving}
          />
        )}

        <Section id="science" icon={Brain} title="Your brain on Day N" hint="Evidence-informed expectations for each stage" color="var(--brand-secondary)">{scienceSection}</Section>
        <Section id="levels" icon={Trophy} title="Level roadmap" hint={`Currently: ${currentLevel.label}`} color="var(--brand-warning)">{levelsSection}</Section>
        <Section id="milestones" icon={Star} title="Milestones" hint={`${getCompletedMilestones(streakDays).length}/${MILESTONES.length} earned`} color="var(--brand-warning)">{milestonesSection}</Section>
        <Section id="challenges" icon={Flame} title="Challenges" hint={data?.activeChallenge ? CHALLENGES.find(c => c.id === data.activeChallenge)?.label : 'Commit to a run'} color="var(--brand-error)">{challengesSection}</Section>
        <Section id="tools" icon={Lightbulb} title="Environment design" hint="Blockers & friction — willpower's best friends" color="var(--brand-primary)">{envToolsSection}</Section>
        <Section id="history" icon={Calendar} title="History & urge log" hint="Your patterns over time" color="var(--text-muted)">{historySection}</Section>

        {/* Daily reminder */}
        <div style={{ ...card, background: `linear-gradient(140deg, var(--bg-card), color-mix(in srgb, ${currentLevel.color} 6%, transparent))` }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.14em', marginBottom: 10, fontWeight: 700 }}>TODAY'S REMINDER</div>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.65, fontWeight: 500 }}>
            {MOTIVATIONAL[Math.floor((streakDays + new Date().getDate()) % MOTIVATIONAL.length)]}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={12} color={currentLevel.color} />
            <span style={{ fontSize: 12, color: currentLevel.color, fontWeight: 600 }}>Every wave you surf makes the next one smaller.</span>
          </div>
        </div>
      </div>

      {showSOS && (
        <SOSOverlay
          streakDays={streakDays}
          onClose={() => setShowSOS(false)}
          onSurfed={handleSurfed}
          onRelapse={() => { setShowSOS(false); setShowRelapse(true) }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   RELAPSE PANEL — structured, non-judgmental debrief
═══════════════════════════════════════════════════════════════ */
function RelapsePanel({ isMobile, streakDays, trigger, setTrigger, note, setNote, onConfirm, onCancel, saving }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid color-mix(in srgb, var(--brand-error) 25%, transparent)',
      borderRadius: 'var(--radius-xl)', padding: isMobile ? '18px 16px' : '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <HeartPulse size={17} color="var(--brand-error)" />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)' }}>Reset & refocus</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, maxWidth: 560 }}>
        Happens to almost everyone on this journey — what matters is the data you take from it.
        Your <strong style={{ color: 'var(--text-primary)' }}>{streakDays}-day</strong> streak resets to zero; your aura and history stay.
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', marginBottom: 8 }}>WHAT TRIGGERED IT?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {TRIGGERS.map(t => {
          const on = trigger === t.id
          return (
            <button key={t.id} onClick={() => setTrigger(on ? '' : t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 'var(--radius-pill)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 38,
                border: `1px solid ${on ? 'var(--brand-error)' : 'var(--border)'}`,
                background: on ? 'var(--red-dim)' : 'transparent',
                color: on ? 'var(--brand-error)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
              <span>{t.emoji}</span> {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', marginBottom: 8 }}>ANY CONTEXT? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(optional)</span></div>
      <textarea value={note} onChange={e => setNote(e.target.value)}
        placeholder="Where were you, what time, what happened right before?"
        rows={2}
        style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={onConfirm} disabled={saving}
          style={{ background: 'var(--brand-error)', border: 'none', borderRadius: 11, color: '#fff', padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, minHeight: 46, opacity: saving ? 0.7 : 1 }}>
          {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
          {saving ? 'Logging…' : 'Log it & start fresh'}
        </button>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 11, color: 'var(--text-muted)', padding: '12px 18px', fontSize: 14, cursor: 'pointer', minHeight: 46 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
