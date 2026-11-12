import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Mic, Wind, Volume2, Activity, MessageSquare, PenTool, Waves, Sparkles, Camera, Video,
  Play, Pause, SkipForward, SkipBack, X, Check, Info, Flame, Clock, RefreshCw,
  Zap, HeartPulse, Brain, ChevronDown, Calendar, Award, MicOff, Square, Timer,
} from 'lucide-react'
import { voiceAPI } from '../api/client'
import { MFBarChart, MFRing } from '../components/MFCharts'

/* ═══════════════════════════════════════════════════════════════
   SPEAK — Communication & Voice Gym (research-based, v3.0)

   Every exercise here is drawn from a real discipline:
   • Diaphragmatic breathing — breath support reduces laryngeal
     tension and steadies subglottal pressure → deeper, fuller
     resonance (core of clinical voice therapy).
   • Humming & lip trills — Semi-Occluded Vocal Tract (SOVT)
     exercises (Titze, Journal of Voice): backpressure cushions
     the vocal folds — the safest fast warm-up that exists.
   • Neck/shoulder release + sustained vowels — physical release
     work from Linklater/Berry voice pedagogy; reduces extrinsic
     laryngeal tension (muscle tension dysphonia protocol).
   • Tongue twisters — articulation motor learning used by
     speech-language pathologists & actors: slow → accurate → fast.
   • Pen-in-mouth & over-tongue reading — classic drama-school
     over-articulation drills; exaggerate the movement, then
     normal speech feels crisp.
   • Expressive styled reading — prosody (pitch, pace, emphasis)
     drives perceived charisma & listener comprehension.
   • On-camera impromptu speaking — deliberate practice +
     exposure (reduces speech anxiety) + PREP structure
     (Point–Reason–Example–Point) + video self-review.

   Plans are composed so each session follows the professional
   order:  Breathe → Warm up → Release → Articulate → Perform.
═══════════════════════════════════════════════════════════════ */

// ─── EXERCISE LIBRARY ────────────────────────────────────────────────────────
const EXERCISES = {
  breath: {
    name: 'Diaphragm Breathing', icon: Wind, color: 'var(--brand-teal)',
    cat: 'Breath', tag: 'Deeper voice',
    why: 'Shallow chest breathing forces your throat to over-work and raises pitch. Belly (diaphragmatic) breathing lowers laryngeal tension and gives steady airflow — the foundation of a deeper, steadier, more projecting voice. Every professional voice warm-up starts here.',
    how: [
      'Lie or sit tall. One hand on chest, one on belly.',
      'Inhale through the nose 4s — belly rises, chest stays quiet.',
      'Hold 2s — keep the throat open and lazy.',
      'Exhale 6s through pursed lips, belly falls flat.',
      'Imagine the sound sitting low in your chest, not in your throat.',
    ],
  },
  hum: {
    name: 'Hum & Lip Trills (SOVT)', icon: Volume2, color: 'var(--brand-primary)',
    cat: 'Warm-up', tag: 'Safe warm-up',
    why: 'Semi-Occluded Vocal Tract exercises (hums, lip trills, straw phonation) create gentle backpressure that cushions the vocal folds and spreads vibration evenly. Voice research (Titze) shows SOVT drills warm up the voice in minutes with the lowest strain of any method. Also front-resonance training — the "mmm" buzz you feel in lips & nose is exactly the placement of a confident, resonant voice.',
    how: [
      'Lip trill: relax lips, blow air so they flap "brrr", ride up and down in pitch.',
      'Hum "mmm" at a comfortable low note — feel buzz on lips and nose bridge.',
      'Slide the hum slowly up to a high note, then back down (siren).',
      'Nasal "ng" (as in "sing") — another occluded variation.',
      'If it tickles or hurts — back off. Warm-ups should feel easy.',
    ],
  },
  stretch: {
    name: 'Neck Release + Vowels', icon: Activity, color: 'var(--brand-mint)',
    cat: 'Warm-up', tag: 'Resonance',
    why: 'Tension in the neck, jaw and shoulders presses on the larynx and strangles resonance — this is the physical release work used in Linklater / Berry voice training and in muscle-tension-dysphonia therapy. Sustaining pure vowels after the release connects breath to voice and balances your vocal tract for clear tone.',
    how: [
      'Clasp hands behind your neck. Chin tucked slightly, shoulders rolled back.',
      'Ear to shoulder — hold 15s each side. Feel the long neck muscles lengthen.',
      'Gentle chin-to-chest stretch 15s. Jaw loose, tongue resting on lower teeth.',
      'Then sustain each vowel 6s on one steady breath: AH — EH — EE — OH — OO.',
      'Keep the behind-neck posture the whole time: it keeps the airway tall.',
    ],
  },
  twisters: {
    name: 'Tongue Twisters', icon: MessageSquare, color: 'var(--brand-secondary)',
    cat: 'Articulation', tag: 'Diction',
    why: 'Twisters overload the articulators (tongue, lips, palate) with similar phonemes — massed motor practice that sharpens precision. Speech-language pathologists and broadcasters use exactly this: say it slow and perfect first, then speed up. Accuracy always beats speed — speed is a side effect.',
    how: [
      'Pick a tier and read the twister once SLOWLY — every consonant crisp.',
      'Repeat ×3, each round a little faster.',
      'Exaggerate lip and tongue movement — this is precision training.',
      'Finish each round at normal speed — it should now feel effortless.',
      'Stumble? Drop back a gear. Slow is smooth, smooth is fast.',
    ],
  },
  pen: {
    name: 'Pen-in-Mouth Reading', icon: PenTool, color: 'var(--purple)',
    cat: 'Articulation', tag: 'Clarity',
    why: 'The classic drama-school diction drill. Speaking around a pen forces your tongue and lips into exaggerated, full-range movement. When you take the pen away, everyday speech suddenly sounds crisp — your articulators have been strength-trained through a harder condition than real speech ever demands.',
    how: [
      'Put a pen (or two fingers) horizontally under your tongue, mouth gently closed over it.',
      'Read the passage aloud — force every word to be understandable anyway.',
      'Don\'t rush. Over-enunciate: separate consonants, open vowels.',
      '2–3 minutes is plenty — the muscles fatigue fast (that\'s the point).',
      'Remove the pen and read 1 more paragraph — hear the instant clarity boost.',
    ],
  },
  tongue: {
    name: 'Over-Tongue Reading', icon: Waves, color: 'var(--brand-warning)',
    cat: 'Articulation', tag: 'Agility',
    why: 'Over-articulation with pure tongue movement — no obstruction. You deliberately use 200% of your normal tongue travel on every syllable. This builds tongue agility and re-trains lazy speech habits (mumbled word-endings, swallowed consonants) that make speakers sound unsure.',
    how: [
      'Read the passage and exaggerate ONLY the tongue: flick, curl, tap every T, L, N, K.',
      'Feel the tip, blade and back of the tongue all working.',
      'Keep the jaw relaxed — the tongue moves, not the whole face.',
      'Then re-read normally. Word endings should now land cleanly.',
      'Great before interviews, recordings and presentations.',
    ],
  },
  style: {
    name: 'Expressive Reading', icon: Sparkles, color: 'var(--pink)',
    cat: 'Performance', tag: 'Prosody',
    why: 'Monotone kills attention. Prosody — pitch movement, pacing, emphasis, pauses — is what listeners actually decode as confidence and meaning. Practicing the same text in wildly different styles expands your range, so your "normal" delivery keeps energy and your message lands.',
    how: [
      'Read the passage in the given style — fully commit, no half-measures.',
      'Push pitch variation: some words UP, some DOWN. Pause for effect.',
      'Stress different words each round: "I never said he stole the money."',
      'Exaggerate until it feels silly — your comfortable range will grow.',
      'Finish with one normal read. Notice how much more alive it sounds.',
    ],
  },
  camera: {
    name: 'On-Camera Impromptu', icon: Camera, color: 'var(--brand-success)',
    cat: 'Performance', tag: 'Confidence',
    why: 'Speaking on a random topic on camera is deliberate practice with exposure — the two ingredients that reliably reduce speech anxiety. The PREP framework (Point → Reason → Example → Point) gives you instant structure so you never ramble. Watching yourself back builds the self-awareness that coaches charge for.',
    how: [
      'Camera runs 100% on your device — nothing is ever uploaded.',
      'Draw a random topic. 30s prep: jot Point, Reason, Example with PREP.',
      'Speak 60–90s to the lens. Look at the camera, not at yourself.',
      'Watch the replay once: one thing to keep, one thing to fix.',
      'Done > perfect. Filler words fade with reps, not with worry.',
    ],
  },
}

// ─── TONGUE TWISTERS ─────────────────────────────────────────────────────────
const TWISTERS = {
  bronze: [
    'She sells seashells by the seashore.',
    'Red lorry, yellow lorry, red lorry, yellow lorry.',
    'Toy boat. Toy boat. Toy boat.',
    'Which wristwatch is a Swiss wristwatch?',
    'Three thin thieves thought a thousand thoughts.',
    'A tidy tiger tied a tie to tidy its tail.',
  ],
  silver: [
    'Peter Piper picked a peck of pickled peppers.',
    'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
    'Betty Botter bought some butter, but she said the butter\'s bitter.',
    'Six slippery snails slid silently seaward.',
    'Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.',
    'The thirty-three thieves thought that they thrilled the throne throughout Thursday.',
  ],
  gold: [
    'The sixth sick sheikh\'s sixth sheep\'s sick.',
    'Brisk brave brigadiers brandished broad bright blades, blunderbusses and bludgeons.',
    'Imagine an imaginary menagerie manager imagining managing an imaginary menagerie.',
    'I slit the sheet, the sheet I slit, and on the slitted sheet I sit.',
    'Pad kid poured the curd plum.',
    'Six Swiss shrinks successfully switched six short shrubs.',
  ],
}
const TIER_META = {
  bronze: { label: 'Bronze', desc: 'Start here — build accuracy' },
  silver: { label: 'Silver', desc: 'Standard broadcast drill' },
  gold:   { label: 'Gold',   desc: 'Even pros stumble' },
}

// ─── READING PASSAGES (original, ~90 words each) ─────────────────────────────
const PASSAGES = {
  narrative: {
    label: 'Narrative',
    text: `The morning market woke before the sun did. Canvas roofs rustled, crates of oranges thumped onto wooden tables, and somewhere a kettle began to sing. Mira counted her coins twice, folded them into a handkerchief, and stepped into the crowd. The baker knew her order before she spoke; the fishmonger always saved the coldest box. By eight o'clock the square was a river of voices — bargaining, laughing, calling names across the noise. Mira moved through it like a swimmer through waves, unhurried, certain, already home.`,
  },
  informative: {
    label: 'Informative',
    text: `Sleep is not downtime — it is active maintenance. While you rest, the brain clears metabolic waste, replays the day's memories, and files the ones worth keeping. Muscle tissue repairs itself, and hormone levels reset for the next cycle. Studies show that even mild sleep loss slows reaction time, dulls attention, and makes emotional regulation measurably harder. The practical rule is simple: a consistent schedule beats a long weekend of recovery. Treat sleep like training, not like a luxury, and every other habit in your day gets easier.`,
  },
  persuasive: {
    label: 'Persuasive',
    text: `Every skill you admire in someone else was built in boring, repeatable sessions. The speaker who owns the stage once fumbled through a mirror. The athlete who makes it look easy has an entire decade of unglamorous reps behind the highlight. So the honest question is not "do I have talent?" — it is "will I show up today?" Choose the small session over the perfect plan. Choose fifteen honest minutes over a postponed hour. Momentum is not motivation; it is what motivation becomes when you simply refuse to skip.`,
  },
}

const STYLES = [
  { id: 'anchor',  label: '📺 News Anchor',      tip: 'Neutral, clear, steady pace. Every consonant lands.' },
  { id: 'story',   label: '🌙 Bedtime Storyteller', tip: 'Slow, warm, low pitch. Long pauses. Pull listeners in.' },
  { id: 'coach',   label: '😤 Halftime Coach',    tip: 'Loud, urgent, punchy. Short sentences. Rise and fall.' },
  { id: 'motivate',label: '🔥 Keynote Speaker',   tip: 'Build from calm to powerful. Emphasize the big words.' },
  { id: 'whisper', label: '🤫 Secret Whisper',    tip: 'Barely audible — articulation must carry every word.' },
  { id: 'auction', label: '⚡ Auctioneer',        tip: 'Fast and rhythmic. Keep it clean at speed.' },
]

// ─── IMPROMPTU TOPICS ────────────────────────────────────────────────────────
const TOPICS = [
  'What superpower would actually ruin your life?',
  'The best advice you ever ignored — and why you were wrong.',
  'If you had one extra hour every day, forever, what would you do with it?',
  'Persuade me to move to your hometown.',
  'What is something everyone does that will look ridiculous in 50 years?',
  'The most overrated "life hack" you have ever tried.',
  'Explain your job (or studies) to a five-year-old.',
  'Should social media have an age limit? Argue one side.',
  'The one meal everyone should learn to cook, and why.',
  'What would you do first if you woke up 100 years in the past?',
  'Why the small, boring habits beat the big dramatic ones.',
  'If money were no object for one year, describe your perfect week.',
]

const PREP = [
  { k: 'P', t: 'Point', d: 'State your main claim in ONE sentence.' },
  { k: 'R', t: 'Reason', d: 'Give the "because" — the core reason it\'s true.' },
  { k: 'E', t: 'Example', d: 'One quick story, number or comparison.' },
  { k: 'P', t: 'Point (again)', d: 'Restate the claim. End strong, don\'t trail off.' },
]

// ─── PLANS — professional order: Breathe → Warm up → Release → Articulate → Perform ──
const PLANS = {
  15: {
    id: '15', label: 'Quick', total: 15,
    tagline: 'Daily minimum. Warm the voice and sharpen diction.',
    steps: [
      { ex: 'breath',   min: 3 },
      { ex: 'hum',      min: 2 },
      { ex: 'stretch',  min: 2 },
      { ex: 'twisters', min: 4 },
      { ex: 'style',    min: 4 },
    ],
  },
  30: {
    id: '30', label: 'Standard', total: 30,
    tagline: 'The full pipeline — warm-up through impromptu performance.',
    steps: [
      { ex: 'breath',   min: 4 },
      { ex: 'hum',      min: 4 },
      { ex: 'stretch',  min: 3 },
      { ex: 'twisters', min: 6 },
      { ex: 'pen',      min: 5 },
      { ex: 'style',    min: 4 },
      { ex: 'camera',   min: 4 },
    ],
  },
  60: {
    id: '60', label: 'Deep', total: 60,
    tagline: 'Complete gym session for the voice. Every drill, longer sets.',
    steps: [
      { ex: 'breath',   min: 6 },
      { ex: 'hum',      min: 6 },
      { ex: 'stretch',  min: 5 },
      { ex: 'twisters', min: 8 },
      { ex: 'pen',      min: 8 },
      { ex: 'tongue',   min: 6 },
      { ex: 'style',    min: 8 },
      { ex: 'camera',   min: 13 },
    ],
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function calcStreak(sessions) {
  const days = new Set(sessions.map(s => s.date))
  let streak = 0
  const d = new Date()
  if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1)
  while (days.has(dateKey(d))) { streak++; d.setDate(d.getDate() - 1) }
  return streak
}

function last7Days(sessions) {
  const out = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const k = dateKey(d)
    const mins = sessions.filter(s => s.date === k).reduce((a, s) => a + (s.minutes || 0), 0)
    out.push({ label: i === 0 ? 'Today' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], value: mins })
  }
  return out
}

function thisWeekMinutes(sessions) {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // Mon = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow)
  return sessions.filter(s => s.ts && new Date(s.ts) >= monday).reduce((a, s) => a + (s.minutes || 0), 0)
}

const pad = (n) => String(n).padStart(2, '0')
const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`

const LS_KEY = 'mf_speak_log_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null } catch { return null }
}
function saveLocal(log) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(log)) } catch { /* private mode */ }
}

// ═══════════════════════════════════════════════════════════════
// BREATHING PACER — 4-2-6 paced diaphragmatic breathing
// ═══════════════════════════════════════════════════════════════
function BreathingPacer({ active = true }) {
  const PHASES = [
    { name: 'Inhale', secs: 4, hint: 'Nose — belly rises, chest quiet', color: 'var(--brand-teal)' },
    { name: 'Hold',   secs: 2, hint: 'Throat open and lazy',           color: 'var(--brand-mint)' },
    { name: 'Exhale', secs: 6, hint: 'Pursed lips — long and slow',    color: 'var(--brand-primary)' },
    { name: 'Rest',   secs: 1, hint: 'Stay empty a beat',              color: 'var(--brand-secondary)' },
  ]
  const CYCLE = PHASES.reduce((a, p) => a + p.secs, 0)
  const [t, setT] = useState(0)
  const breathsRef = useRef(0)
  const [breaths, setBreaths] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => setT(prev => (prev + 0.1) % CYCLE), 100)
    return () => clearInterval(iv)
  }, [active, CYCLE])

  // count completed cycles
  useEffect(() => {
    const cycles = Math.floor((t + 0.1) / CYCLE)
    if (cycles > breathsRef.current) { breathsRef.current = cycles; setBreaths(cycles) }
    if (t < 0.12) { breathsRef.current = 0; setBreaths(0) }
  }, [t, CYCLE])

  let acc = 0
  let phase = PHASES[0], phaseElapsed = 0
  for (const p of PHASES) {
    if (t < acc + p.secs) { phase = p; phaseElapsed = t - acc; break }
    acc += p.secs
  }
  const remaining = Math.ceil(phase.secs - phaseElapsed)
  const progress = phaseElapsed / phase.secs

  // scale animation: inhale grows, hold stays, exhale shrinks
  let scale
  if (phase.name === 'Inhale') scale = 1.0 + 0.55 * progress
  else if (phase.name === 'Hold') scale = 1.55
  else if (phase.name === 'Exhale') scale = 1.55 - 0.55 * progress
  else scale = 1.0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '10px 0' }}>
      <div style={{ position: 'relative', width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* halo */}
        <div style={{
          position: 'absolute', width: 190, height: 190, borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${phase.color} 22%, transparent) 0%, transparent 70%)`,
          transform: `scale(${scale / 1.35})`, transition: 'transform 0.12s linear', opacity: 0.9,
        }} />
        <div style={{
          width: 116, height: 116, borderRadius: '50%',
          background: `color-mix(in srgb, ${phase.color} 16%, transparent)`,
          border: `2.5px solid ${phase.color}`,
          transform: `scale(${scale})`,
          transition: 'transform 0.12s linear, border-color 0.5s, background 0.5s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            {phase.name}
          </span>
          <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: phase.color, lineHeight: 1 }}>
            {remaining}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{phase.hint}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
        {breaths} breath{breaths === 1 ? '' : 's'} completed
      </div>
      {/* hand position reminder */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <HeartPulse size={13} style={{ color: 'var(--brand-teal)' }} />
        One hand on chest, one on belly — only the belly moves.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HUM & LIP TRILLS — SOVT pattern ladder
// ═══════════════════════════════════════════════════════════════
function HumTrills({ active = true }) {
  const STEPS = [
    { label: 'Lip trill — steady "brrr"', secs: 15, icon: '👄', detail: 'Flap the lips on one comfortable note. Feel the tickle.' },
    { label: 'Hum "mmm" — low & lazy', secs: 12, icon: '🎵', detail: 'Feel buzz on the lips and nose bridge. Jaw hanging.' },
    { label: 'Siren — slide up then down', secs: 15, icon: '📈', detail: 'Hum from low to high and back, slow like a slide whistle.' },
    { label: 'Nasal "ng" — as in "sing"', secs: 12, icon: '🗣️', detail: 'Same buzz, mouth closed, tongue back.' },
    { label: 'Lip trill — ride the rollercoaster', secs: 15, icon: '🎢', detail: 'Trill up and down the scale. Smooth, unforced.' },
  ]
  const TOTAL = STEPS.reduce((a, s) => a + s.secs, 0)
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => setT(prev => (prev + 1) % TOTAL), 1000)
    return () => clearInterval(iv)
  }, [active, TOTAL])

  let acc = 0, idx = 0, elapsed = 0
  for (let i = 0; i < STEPS.length; i++) {
    if (t < acc + STEPS[i].secs) { idx = i; elapsed = t - acc; break }
    acc += STEPS[i].secs
  }
  const step = STEPS[idx]
  const left = step.secs - elapsed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      {/* waveform bars — animate when active */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
        {[0.9, 0.5, 1.1, 0.7, 1.3, 0.6, 1.0, 0.8, 1.2, 0.55, 0.95, 0.75].map((f, i) => (
          <div key={i} style={{
            width: 9, borderRadius: 5,
            background: `color-mix(in srgb, var(--brand-primary) ${45 + i * 3}%, transparent)`,
            height: 16, animation: active ? `mfhum 1.15s ease-in-out ${i * 0.09}s infinite alternate` : 'none',
            '--mf-h': `${14 + f * 34}px`,
          }} />
        ))}
      </div>
      <style>{`@keyframes mfhum { from { height: 8px } to { height: var(--mf-h) } }`}</style>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        borderRadius: 'var(--radius-lg)', background: 'var(--brand-primary-dim)',
        border: '1px solid color-mix(in srgb, var(--brand-primary) 26%, transparent)',
        maxWidth: 420, width: '100%',
      }}>
        <span style={{ fontSize: 26 }}>{step.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{step.label}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{step.detail}</div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--brand-primary)', minWidth: 34, textAlign: 'right' }}>
          {left}s
        </span>
      </div>

      {/* step dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            width: i === idx ? 22 : 7, height: 7, borderRadius: 4,
            background: i === idx ? 'var(--brand-primary)' : 'var(--border-bright)',
            transition: 'all 0.4s var(--ease-out-expo)',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        If lips won't trill: press cheeks lightly, or hum instead. No strain — ever.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// NECK RELEASE + SUSTAINED VOWELS
// ═══════════════════════════════════════════════════════════════
function NeckVowels({ active = true }) {
  const STRETCHES = [
    { label: 'Hands clasped behind neck', sub: 'Elbows wide, chest tall. This posture stays.', secs: 12, icon: '🙌' },
    { label: 'Ear → right shoulder', sub: 'Long, slow side stretch. Jaw loose.', secs: 12, icon: '👉' },
    { label: 'Ear → left shoulder', sub: 'Same length, same calm breath.', secs: 12, icon: '👈' },
    { label: 'Chin → chest', sub: 'Back of neck lengthens. Tongue rests low.', secs: 12, icon: '⬇️' },
    { label: 'Shoulder rolls back ×5', sub: 'Big slow circles. Release the weight.', secs: 12, icon: '🔄' },
  ]
  const VOWELS = ['AH', 'EH', 'EE', 'OH', 'OO']
  const VOWEL_SECS = 6
  const WARM = STRETCHES.reduce((a, s) => a + s.secs, 0)
  const LOOP = WARM + VOWELS.length * VOWEL_SECS * 2 // 2 vowel rounds
  const [t, setT] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => setT(prev => (prev + 1) % LOOP), 1000)
    return () => clearInterval(iv)
  }, [active, LOOP])

  const inStretch = t < WARM
  let idx = 0, elapsed = 0
  if (inStretch) {
    let acc = 0
    for (let i = 0; i < STRETCHES.length; i++) {
      if (t < acc + STRETCHES[i].secs) { idx = i; elapsed = t - acc; break }
      acc += STRETCHES[i].secs
    }
  } else {
    const vt = t - WARM
    idx = Math.floor(vt / VOWEL_SECS) % VOWELS.length
    elapsed = vt % VOWEL_SECS
  }
  const left = (inStretch ? STRETCHES[idx].secs : VOWEL_SECS) - elapsed
  const round = !inStretch ? (Math.floor((t - WARM) / (VOWELS.length * VOWEL_SECS)) + 1) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '5px 12px', borderRadius: 99,
          background: inStretch ? 'rgba(102,212,207,0.15)' : 'var(--brand-primary-dim)',
          color: inStretch ? 'var(--brand-mint)' : 'var(--brand-primary)',
        }}>
          {inStretch ? 'Phase 1 · Release' : `Phase 2 · Vowel round ${round}/2`}
        </span>
      </div>

      {inStretch ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass)', border: '1px solid var(--border)',
          maxWidth: 420, width: '100%',
        }}>
          <span style={{ fontSize: 26 }}>{STRETCHES[idx].icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{STRETCHES[idx].label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{STRETCHES[idx].sub}</div>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--brand-mint)' }}>{left}s</span>
        </div>
      ) : (
        <>
          <div style={{
            width: 130, height: 130, borderRadius: '50%', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={130} height={130} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle cx={65} cy={65} r={58} fill="none" stroke="var(--border)" strokeWidth={7} />
              <circle
                cx={65} cy={65} r={58} fill="none" stroke="var(--brand-primary)" strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={`${(elapsed / VOWEL_SECS) * 2 * Math.PI * 58} ${2 * Math.PI * 58}`}
              />
            </svg>
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {VOWELS[idx]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {VOWELS.map((v, i) => (
              <span key={v} style={{
                fontSize: 13, fontWeight: 700, padding: '7px 12px', borderRadius: 10,
                background: i === idx ? 'var(--brand-primary)' : 'var(--bg-glass)',
                color: i === idx ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${i === idx ? 'var(--brand-primary)' : 'var(--border)'}`,
                opacity: i > idx && round === 1 ? 0.45 : 1,
                transition: 'all 0.3s',
              }}>{v}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            One steady breath per vowel — keep the behind-neck posture tall.
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TONGUE TWISTER DECK
// ═══════════════════════════════════════════════════════════════
function TwisterDeck() {
  const [tier, setTier] = useState('bronze')
  const [card, setCard] = useState(() => TWISTERS.bronze[0])
  const [reps, setReps] = useState(0)
  const [done, setDone] = useState(0)

  const shuffle = useCallback((t = tier) => {
    const list = TWISTERS[t]
    let next = card
    while (next === card && list.length > 1) next = list[Math.floor(Math.random() * list.length)]
    setCard(next); setReps(0)
  }, [tier, card])

  const changeTier = (t) => { setTier(t); shuffle(t) }

  const tapRep = () => {
    if (reps >= 3) { setDone(d => d + 1); shuffle() } else setReps(r => r + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%' }}>
      {/* tier selector */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 99,
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
      }}>
        {Object.keys(TIER_META).map(t => (
          <button key={t} onClick={() => changeTier(t)} style={{
            padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
            background: tier === t ? 'var(--brand-secondary)' : 'transparent',
            color: tier === t ? '#fff' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, transition: 'all 0.25s var(--ease-out-expo)',
          }}>
            {TIER_META[t].label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{TIER_META[tier].desc}</div>

      {/* card */}
      <div style={{
        width: '100%', maxWidth: 480, padding: '26px 26px 22px', borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
        boxShadow: 'var(--shadow-md)', textAlign: 'center', position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'var(--brand-secondary-dim)', color: 'var(--brand-secondary)',
          padding: '4px 12px', borderRadius: 99, border: '1px solid color-mix(in srgb, var(--brand-secondary) 30%, transparent)',
        }}>
          {reps >= 3
            ? `Mastered — grab the next one`
            : `Round ${reps + 1} of 3 · ${tier === 'bronze' ? 'Slow & perfect' : tier === 'silver' ? 'Building speed' : 'Full send'}`}
        </span>
        <div style={{
          fontSize: 21, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.01em',
          color: 'var(--text-primary)', padding: '14px 4px 6px', fontFamily: 'var(--font-display)',
        }}>
          "{card}"
        </div>
      </div>

      {/* reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: reps > i || (reps >= 3) ? 'var(--brand-secondary)' : 'var(--bg-glass)',
            border: `1.5px solid ${reps > i || (reps >= 3) ? 'var(--brand-secondary)' : 'var(--border-bright)'}`,
            color: reps > i || (reps >= 3) ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, transition: 'all 0.25s var(--ease-spring)',
          }}>
            {reps > i || (reps >= 3) ? <Check size={14} /> : i + 1}
          </div>
        ))}
        <button onClick={tapRep} style={{
          marginLeft: 8, display: 'flex', alignItems: 'center', gap: 7,
          padding: '10px 18px', borderRadius: 99, border: 'none', cursor: 'pointer',
          background: reps >= 3 ? 'var(--brand-success)' : 'var(--brand-secondary)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          transition: 'transform 0.2s var(--ease-spring)',
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {reps >= 3 ? <><Check size={15} /> Next twister</> : <>Say it ×{3 - reps}</>}
        </button>
        <button onClick={() => shuffle()} title="Shuffle twister" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '10px 12px', borderRadius: 99, cursor: 'pointer',
          background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
        }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Twisters mastered this session: <b style={{ color: 'var(--text-secondary)' }}>{done}</b> · Slow → accurate → fast. Never fast & sloppy.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// READING DRILL — pen-in-mouth / over-tongue / expressive styles
// ═══════════════════════════════════════════════════════════════
function ReadingDrill({ mode }) {
  const [passage, setPassage] = useState('narrative')
  const [styleIdx, setStyleIdx] = useState(0)

  const modeMeta = {
    pen: {
      banner: '✏️ Pen under tongue — over-enunciate every word',
      color: 'var(--purple)',
      tip: 'Force the words to be understandable AROUND the pen. Don\'t rush — clarity is the metric.',
    },
    tongue: {
      banner: '👅 200% tongue travel — flick, curl, tap every consonant',
      color: 'var(--brand-warning)',
      tip: 'Jaw stays relaxed. Only the tongue works. Word endings must land: "fiN-AL", "co-RR-ECT".',
    },
    style: {
      banner: `🎭 Style: ${STYLES[styleIdx].label}`,
      color: 'var(--pink)',
      tip: STYLES[styleIdx].tip,
    },
  }[mode]

  const p = PASSAGES[passage]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 560 }}>
      {/* banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        background: `color-mix(in srgb, ${modeMeta.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${modeMeta.color} 28%, transparent)`,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: modeMeta.color }}>{modeMeta.banner}</span>
      </div>

      {mode === 'style' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {STYLES.map((s, i) => (
            <button key={s.id} onClick={() => setStyleIdx(i)} style={{
              padding: '8px 13px', borderRadius: 99, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: i === styleIdx ? 'var(--pink)' : 'var(--bg-glass)',
              color: i === styleIdx ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${i === styleIdx ? 'var(--pink)' : 'var(--border)'}`,
              transition: 'all 0.25s var(--ease-out-expo)',
            }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* passage picker */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.keys(PASSAGES).map(k => (
          <button key={k} onClick={() => setPassage(k)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: passage === k ? 'var(--brand-primary-dim)' : 'var(--bg-glass)',
            color: passage === k ? 'var(--brand-primary)' : 'var(--text-secondary)',
            border: `1px solid ${passage === k ? 'color-mix(in srgb, var(--brand-primary) 30%, transparent)' : 'var(--border)'}`,
            transition: 'all 0.2s',
          }}>
            {PASSAGES[k].label}
          </button>
        ))}
      </div>

      {/* passage */}
      <div style={{
        padding: '20px 22px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
        boxShadow: 'var(--shadow-sm)',
        maxHeight: 260, overflowY: 'auto',
      }}>
        <p style={{ fontSize: 16.5, lineHeight: 1.75, color: 'var(--text-primary)', letterSpacing: '0.005em' }}>
          {p.text}
        </p>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={14} style={{ color: modeMeta.color, flexShrink: 0, marginTop: 1 }} />
        {modeMeta.tip}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CAMERA STUDIO — impromptu speaking with PREP + local video
// ═══════════════════════════════════════════════════════════════
function CameraStudio() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const [camOn, setCamOn] = useState(false)
  const [camError, setCamError] = useState('')
  const [topic, setTopic] = useState(() => TOPICS[Math.floor(Math.random() * TOPICS.length)])
  const [phase, setPhase] = useState('idle') // idle | prep | speak | review
  const [left, setLeft] = useState(0)
  const [recording, setRecording] = useState(false)
  const [clipUrl, setClipUrl] = useState(null)
  const ivRef = useRef(null)

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (ivRef.current) clearInterval(ivRef.current)
    if (clipUrl) URL.revokeObjectURL(clipUrl)
  }, [])

  const startCam = async () => {
    setCamError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      streamRef.current = s
      if (videoRef.current) { videoRef.current.srcObject = s }
      setCamOn(true)
    } catch {
      setCamError('Camera unavailable — practice in a mirror instead. The drill works the same.')
    }
  }
  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamOn(false)
    setRecording(false)
  }

  const runTimer = (secs, next) => {
    if (ivRef.current) clearInterval(ivRef.current)
    setLeft(secs)
    ivRef.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) { clearInterval(ivRef.current); ivRef.current = null; next(); return 0 }
        return l - 1
      })
    }, 1000)
  }

  const newTopic = () => {
    let t = topic
    while (t === topic) t = TOPICS[Math.floor(Math.random() * TOPICS.length)]
    setTopic(t); setPhase('idle'); setClipUrl(null); setRecording(false)
  }

  const startPrep = () => { setClipUrl(null); setPhase('prep'); runTimer(30, () => startSpeak(false)) }
  const startSpeak = (withRec = true) => {
    setPhase('speak')
    if (withRec && camOn && window.MediaRecorder) {
      try {
        chunksRef.current = []
        const rec = new MediaRecorder(streamRef.current)
        rec.ondataavailable = e => e.data.size && chunksRef.current.push(e.data)
        rec.onstop = () => {
          if (chunksRef.current.length) {
            const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' })
            setClipUrl(URL.createObjectURL(blob))
          }
        }
        rec.start()
        recRef.current = rec
        setRecording(true)
      } catch { /* recording optional */ }
    }
    runTimer(60, finishSpeak)
  }
  const finishSpeak = () => {
    if (recording && recRef.current?.state === 'recording') recRef.current.stop()
    setRecording(false)
    setPhase('review')
  }
  const reset = () => {
    if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null }
    if (recording && recRef.current?.state === 'recording') recRef.current.stop()
    setRecording(false); setPhase('idle'); setLeft(0)
  }

  const PHASE_META = {
    idle:   { label: 'Ready', color: 'var(--text-secondary)', note: 'Read the topic. When you\'re ready — 30s prep, then speak.' },
    prep:   { label: 'Prep', color: 'var(--brand-warning)', note: 'Jot PREP: Point → Reason → Example → Point. Bullet notes only!' },
    speak:  { label: 'Speak', color: 'var(--red)', note: 'Look at the LENS, not at yourself. Point → Reason → Example → Point.' },
    review: { label: 'Review', color: 'var(--brand-success)', note: 'Watch once. Pick ONE thing to keep and ONE to fix next round.' },
  }
  const meta = PHASE_META[phase]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%' }}>
      {/* camera area */}
      <div style={{
        width: '100%', maxWidth: 460, aspectRatio: '4/3', borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
        position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
      }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{
            width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
            display: camOn ? 'block' : 'none',
          }}
        />
        {!camOn && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: 'rgba(48,209,88,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Video size={22} style={{ color: 'var(--brand-success)' }} />
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>Face the lens</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 300 }}>
              Camera runs 100% on your device — nothing is uploaded. Recordings stay in this tab only.
            </div>
            <button onClick={startCam} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              borderRadius: 99, border: 'none', cursor: 'pointer',
              background: 'var(--brand-success)', color: '#fff', fontSize: 14, fontWeight: 700,
            }}>
              <Camera size={15} /> Turn on camera
            </button>
            {camError && <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 320 }}>{camError}</div>}
          </div>
        )}
        {camOn && phase === 'speak' && (
          <div style={{
            position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'mfpulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              REC · {pad(Math.floor(left / 60))}:{pad(left % 60)}
            </span>
          </div>
        )}
        <style>{`@keyframes mfpulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>
      </div>

      {/* phase chip + timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '5px 12px', borderRadius: 99,
          background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
          color: meta.color,
        }}>
          {meta.label}
        </span>
        {(phase === 'prep' || phase === 'speak') && (
          <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {pad(Math.floor(left / 60))}:{pad(left % 60)}
          </span>
        )}
      </div>

      {/* topic card */}
      <div style={{
        width: '100%', maxWidth: 480, padding: '18px 20px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--border-bright)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Today's topic
        </div>
        <div style={{ fontSize: 17.5, fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
          {topic}
        </div>
      </div>

      {/* PREP structure */}
      <div style={{ width: '100%', maxWidth: 480, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
        {PREP.map(p => (
          <div key={p.t} style={{
            padding: '10px 6px 9px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-glass)', border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-success)' }}>{p.k}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {phase === 'idle' && (
          <>
            <button onClick={startPrep} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 99,
              border: 'none', cursor: 'pointer', background: 'var(--brand-primary)', color: '#fff',
              fontSize: 14, fontWeight: 700,
            }}>
              <Timer size={15} /> Start · 30s prep + 60s speak
            </button>
            <button onClick={newTopic} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 99,
              border: '1px solid var(--border-bright)', cursor: 'pointer',
              background: 'var(--bg-glass)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
            }}>
              <RefreshCw size={14} /> New topic
            </button>
          </>
        )}
        {(phase === 'prep' || phase === 'speak') && (
          <>
            <button onClick={() => finishSpeak()} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 99,
              border: '1px solid var(--border-bright)', cursor: 'pointer',
              background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
            }}>
              <SkipForward size={14} /> {phase === 'prep' ? 'Skip to speaking' : 'I\'m done speaking'}
            </button>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 99,
              border: '1px solid var(--border-bright)', cursor: 'pointer',
              background: 'var(--red-dim)', color: 'var(--red)', fontSize: 14, fontWeight: 600,
            }}>
              <X size={14} /> Reset
            </button>
          </>
        )}
        {phase === 'review' && (
          <>
            <button onClick={newTopic} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 99,
              border: 'none', cursor: 'pointer', background: 'var(--brand-primary)', color: '#fff',
              fontSize: 14, fontWeight: 700,
            }}>
              <RefreshCw size={15} /> Next topic
            </button>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 99,
              border: '1px solid var(--border-bright)', cursor: 'pointer',
              background: 'var(--bg-glass)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
            }}>
              Same topic again
            </button>
          </>
        )}
        {camOn && (
          <button onClick={stopCam} title="Turn camera off" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px', borderRadius: 99,
            border: '1px solid var(--border)', cursor: 'pointer',
            background: 'var(--bg-glass)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
          }}>
            <MicOff size={14} /> Camera off
          </button>
        )}
      </div>

      {/* replay */}
      {clipUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: '100%', maxWidth: 460 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Your take — local only
          </div>
          <video src={clipUrl} controls playsInline style={{
            width: '100%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: '#000',
          }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            One thing to <b style={{ color: 'var(--brand-success)' }}>keep</b> · one thing to <b style={{ color: 'var(--brand-warning)' }}>fix</b>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start', maxWidth: 460 }}>
        <Info size={14} style={{ color: 'var(--brand-success)', flexShrink: 0, marginTop: 1 }} />
        {meta.note}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SESSION PLAYER — guided sequence with per-step timers
// ═══════════════════════════════════════════════════════════════
function SessionPlayer({ plan, onExit, onComplete }) {
  const isMobile = useIsMobile()
  const [stepIdx, setStepIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(plan.steps[0].min * 60)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const totalSecs = useMemo(() => plan.steps.reduce((a, s) => a + s.min * 60, 0), [plan])

  const elapsedBefore = useMemo(() =>
    plan.steps.slice(0, stepIdx).reduce((a, s) => a + s.min * 60, 0), [plan, stepIdx])
  const elapsedTotal = finished ? totalSecs : elapsedBefore + (plan.steps[stepIdx].min * 60 - secondsLeft)
  const pct = Math.min(100, (elapsedTotal / totalSecs) * 100)

  // countdown
  useEffect(() => {
    if (!running || finished) return
    const iv = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          // advance
          clearInterval(iv)
          setTimeout(() => {
            setStepIdx(i => {
              const next = i + 1
              if (next >= plan.steps.length) { setFinished(true); setRunning(false); return i }
              setSecondsLeft(plan.steps[next].min * 60)
              return next
            })
          }, 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [running, finished, plan])

  const goto = (i) => {
    const clamped = Math.max(0, Math.min(i, plan.steps.length - 1))
    setStepIdx(clamped)
    setSecondsLeft(plan.steps[clamped].min * 60)
  }

  const step = plan.steps[stepIdx]
  const ex = EXERCISES[step.ex]
  const Icon = ex.icon

  const finish = () => {
    setFinished(true); setRunning(false)
    onComplete({
      minutes: Math.max(1, Math.round(elapsedTotal / 60)),
      stepsDone: stepIdx + 1,
      totalSteps: plan.steps.length,
    })
  }

  // ── FINISH SCREEN ──
  if (finished) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto',
      }}>
        <div className="mf-sheet" style={{ width: 'min(94vw, 460px)', padding: '36px 30px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
            background: 'rgba(48,209,88,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sheet-in 0.5s var(--ease-spring)',
          }}>
            <Check size={34} style={{ color: 'var(--brand-success)' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Session complete</h2>
          <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
            {Math.round(elapsedTotal / 60)} minutes of deliberate voice work.
            Your articulators, breath and confidence all got reps today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '22px 0 26px', flexWrap: 'wrap' }}>
            {[
              { icon: Clock, label: `${Math.round(elapsedTotal / 60)} min`, color: 'var(--brand-primary)' },
              { icon: Check, label: `${stepIdx + 1}/${plan.steps.length} drills`, color: 'var(--brand-success)' },
              { icon: Flame, label: 'streak +1', color: 'var(--brand-orange)' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                borderRadius: 99, background: 'var(--bg-glass)', border: '1px solid var(--border)',
              }}>
                <s.icon size={14} style={{ color: s.color }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <button onClick={onExit} style={{
            width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)', border: 'none',
            background: 'var(--brand-primary)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>
            Done
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYER ──
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '12px 16px' : '16px 28px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-overlay)',
        backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        flexShrink: 0,
      }}>
        <button onClick={() => setConfirmEnd(true)} aria-label="End session" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 9,
          borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', minHeight: 36, minWidth: 36,
        }}>
          <X size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {plan.id}-min · {ex.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
            Drill {stepIdx + 1} of {plan.steps.length}
          </div>
        </div>
        <MFRing percent={pct} size={44} stroke={5} color={ex.color}>
          <span style={{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(secondsLeft)}
          </span>
        </MFRing>
      </div>

      {/* progress segments */}
      <div style={{ display: 'flex', gap: 4, padding: isMobile ? '10px 16px 0' : '14px 28px 0', flexShrink: 0 }}>
        {plan.steps.map((s, i) => {
          const segPct = i < stepIdx ? 100 : i === stepIdx ? ((s.min * 60 - secondsLeft) / (s.min * 60)) * 100 : 0
          return (
            <button key={i} onClick={() => goto(i)} title={EXERCISES[s.ex].name} style={{
              flex: i === stepIdx ? 2.2 : 1, height: 5, borderRadius: 3, border: 'none', padding: 0,
              cursor: 'pointer', overflow: 'hidden', background: 'var(--border)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0, width: `${segPct}%`,
                background: EXERCISES[s.ex].color, borderRadius: 3,
                transition: 'width 0.5s linear',
              }} />
            </button>
          )
        })}
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '18px 16px 120px' : '28px 28px 130px' }}>
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          {/* step header */}
          <div key={`h-${step.ex}`} className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: `color-mix(in srgb, ${ex.color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${ex.color} 30%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={21} style={{ color: ex.color }} />
            </div>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{ex.name}</h2>
            <span style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 99,
              background: `color-mix(in srgb, ${ex.color} 12%, transparent)`, color: ex.color,
            }}>
              {ex.tag} · {step.min} min
            </span>
          </div>

          {/* interactive tool */}
          <div key={step.ex} className="animate-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {step.ex === 'breath' && <BreathingPacer active={running} />}
            {step.ex === 'hum' && <HumTrills active={running} />}
            {step.ex === 'stretch' && <NeckVowels active={running} />}
            {step.ex === 'twisters' && <TwisterDeck />}
            {step.ex === 'pen' && <ReadingDrill mode="pen" />}
            {step.ex === 'tongue' && <ReadingDrill mode="tongue" />}
            {step.ex === 'style' && <ReadingDrill mode="style" />}
            {step.ex === 'camera' && <CameraStudio />}
          </div>

          {/* why it works */}
          <details style={{
            width: '100%', maxWidth: 560, padding: '0 18px', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
          }}>
            <summary style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', padding: '13px 0',
              listStyle: 'none',
            }}>
              <Brain size={14} style={{ color: ex.color }} />
              Why this works
              <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </summary>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-secondary)', paddingBottom: 14 }}>
              {ex.why}
            </p>
          </details>
        </div>
      </div>

      {/* bottom controls */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '12px 16px calc(14px + env(safe-area-inset-bottom, 0px))' : '14px 28px 20px',
        background: 'var(--bg-overlay)', backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', zIndex: 5,
      }}>
        <button onClick={() => goto(stepIdx - 1)} disabled={stepIdx === 0} aria-label="Previous drill" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
          borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-glass)',
          color: stepIdx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', minHeight: 44, minWidth: 44,
          cursor: stepIdx === 0 ? 'default' : 'pointer', opacity: stepIdx === 0 ? 0.5 : 1,
        }}>
          <SkipBack size={17} />
        </button>
        <button onClick={() => setRunning(r => !r)} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 99,
          cursor: 'pointer',
          background: running ? 'var(--bg-glass)' : 'var(--brand-primary)',
          color: running ? 'var(--text-primary)' : '#fff',
          border: running ? '1px solid var(--border-bright)' : 'none',
          fontSize: 15, fontWeight: 700, minHeight: 44,
          boxShadow: running ? 'none' : '0 4px 18px var(--brand-primary-glow)',
        }}>
          {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
        </button>
        <button
          onClick={() => stepIdx === plan.steps.length - 1 ? finish() : goto(stepIdx + 1)}
          aria-label="Next drill"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 18px',
            borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-glass)',
            color: 'var(--text-secondary)', minHeight: 44, fontSize: 13.5, fontWeight: 600,
          }}>
          {stepIdx === plan.steps.length - 1 ? 'Finish' : 'Skip'} <SkipForward size={16} />
        </button>
      </div>

      {/* confirm end dialog */}
      {confirmEnd && (
        <div onClick={() => setConfirmEnd(false)} style={{
          position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="mf-sheet" onClick={e => e.stopPropagation()} style={{ width: 'min(92vw, 380px)', padding: '24px 22px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>End session early?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.55 }}>
              {Math.round(elapsedTotal / 60)} of {plan.id} minutes done — that time still counts toward your streak.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setConfirmEnd(false); setRunning(false); finish() }} style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                background: 'var(--brand-primary)', color: '#fff', fontSize: 14, fontWeight: 700,
              }}>
                Save & end
              </button>
              <button onClick={() => setConfirmEnd(false)} style={{
                flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              }}>
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIBRARY CARD — expandable science detail
// ═══════════════════════════════════════════════════════════════
function LibraryCard({ exId, open, onToggle, plansIncluding }) {
  const ex = EXERCISES[exId]
  const Icon = ex.icon
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
      border: `1px solid ${open ? 'color-mix(in srgb, ' + ex.color + ' 30%, transparent)' : 'var(--border)'}`,
      transition: 'border-color 0.25s, background 0.25s', overflow: 'hidden',
    }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '14px 16px',
        background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)',
        minHeight: 56,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: `color-mix(in srgb, ${ex.color} 13%, transparent)`,
          border: `1px solid color-mix(in srgb, ${ex.color} 26%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: ex.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{ex.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{ex.cat} · {plansIncluding}</div>
        </div>
        <ChevronDown size={16} style={{
          color: 'var(--text-muted)', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s var(--ease-out-expo)',
        }} />
      </button>
      {open && (
        <div className="animate-in" style={{ padding: '0 16px 16px' }}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start', padding: '11px 13px',
            borderRadius: 'var(--radius-sm)',
            background: `color-mix(in srgb, ${ex.color} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${ex.color} 20%, transparent)`,
            marginBottom: 12,
          }}>
            <Brain size={14} style={{ color: ex.color, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{ex.why}</p>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            How to do it
          </div>
          {ex.how.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0' }}>
              <span style={{
                width: 19, height: 19, borderRadius: 7, flexShrink: 0, marginTop: 1,
                background: `color-mix(in srgb, ${ex.color} 14%, transparent)`,
                color: ex.color, fontSize: 10.5, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════
export default function VoiceCoachView() {
  const isMobile = useIsMobile()
  const [planMin, setPlanMin] = useState(15)
  const [playing, setPlaying] = useState(false)
  const [openLib, setOpenLib] = useState('breath')
  const [log, setLog] = useState({ sessions: [] })
  const [loaded, setLoaded] = useState(false)

  // load (server first, local fallback)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const local = loadLocal()
      try {
        const r = await voiceAPI.get()
        const sessions = r?.data?.sessions || []
        if (!cancelled && sessions.length) setLog({ sessions })
        else if (!cancelled && local) setLog(local)
      } catch {
        if (!cancelled && local) setLog(local)
      } finally { if (!cancelled) setLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [])

  const persist = useCallback((next) => {
    setLog(next)
    saveLocal(next)
    voiceAPI.update({ sessions: next.sessions.slice(-500) }).catch(() => { /* offline: local is source of truth */ })
  }, [])

  const handleComplete = useCallback(({ minutes, stepsDone }) => {
    const entry = {
      date: dateKey(), ts: Date.now(), planId: String(planMin),
      planMinutes: planMin, minutes, stepsDone,
    }
    persist({ sessions: [...log.sessions, entry] })
  }, [log, planMin, persist])

  const streak = calcStreak(log.sessions)
  const totalMinutes = log.sessions.reduce((a, s) => a + (s.minutes || 0), 0)
  const totalSessions = log.sessions.length
  const weekMins = thisWeekMinutes(log.sessions)
  const WEEK_GOAL = 60
  const chartData = useMemo(() => last7Days(log.sessions), [log])

  const plan = PLANS[planMin]
  const planTotal = plan.steps.reduce((a, s) => a + s.min, 0)

  const CATS = ['Breath', 'Warm-up', 'Articulation', 'Performance']

  return (
    <div className="view-scroll" style={{ padding: '0 clamp(16px,3vw,32px) 60px', overflowY: 'auto', height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ padding: '28px 6px 6px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Voice & Communication
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mic size={26} style={{ color: 'var(--brand-teal)' }} /> Speak
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--text-secondary)', marginTop: 5, fontFamily: 'var(--font-body)', maxWidth: 520 }}>
            A research-based gym for your voice — breath, warm-up, articulation and impromptu performance. Trained the way vocal coaches actually train it.
          </p>
        </div>
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99,
            background: 'var(--bg-glass)', border: '1px solid var(--border)', flexShrink: 0, marginTop: 8,
          }}>
            <Brain size={14} style={{ color: 'var(--brand-teal)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Evidence-based drills</span>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
        gap: 14, marginTop: 18,
      }}>
        {/* week ring card */}
        <div className="animate-in" style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
          borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <MFRing percent={(weekMins / WEEK_GOAL) * 100} size={72} stroke={8} color="var(--brand-teal)" label="WEEK" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>This week</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {weekMins}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}> / {WEEK_GOAL} min</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {weekMins >= WEEK_GOAL ? 'Goal hit — voice of a leader 🎙️' : `${WEEK_GOAL - weekMins} min to weekly goal`}
            </div>
          </div>
        </div>

        {[
          { icon: Flame, color: 'var(--brand-orange)', label: 'Practice streak', value: streak, unit: streak === 1 ? 'day' : 'days' },
          { icon: Award, color: 'var(--brand-success)', label: 'Sessions done', value: totalSessions, unit: totalSessions === 1 ? 'session' : 'sessions' },
          { icon: Clock, color: 'var(--brand-primary)', label: 'Total practice', value: totalMinutes, unit: 'min' },
        ].map((s, i) => (
          <div key={i} className="animate-in" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
            borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: `color-mix(in srgb, ${s.color} 13%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>{s.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Plan builder ── */}
      <div className="animate-in" style={{
        marginTop: 22, padding: isMobile ? '20px 18px' : '24px 26px',
        borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Today's routine</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Breathe → Warm up → Release → Articulate → Perform — the professional order.
            </p>
          </div>
          {/* duration segmented control */}
          <div style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 99,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
          }}>
            {[
              { v: 15, label: '15 min' },
              { v: 30, label: '30 min' },
              { v: 60, label: '1 hour' },
            ].map(o => (
              <button key={o.v} onClick={() => setPlanMin(o.v)} style={{
                padding: '9px 18px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: planMin === o.v ? 'var(--brand-teal)' : 'transparent',
                color: planMin === o.v ? '#000' : 'var(--text-secondary)',
                fontSize: 13.5, fontWeight: 700, transition: 'all 0.3s var(--ease-out-expo)',
                minHeight: 36,
              }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, fontWeight: 500 }}>
          {plan.tagline}
        </p>

        {/* steps preview */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plan.steps.map((s, i) => {
            const ex = EXERCISES[s.ex]
            const Icon = ex.icon
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', width: 16, fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </span>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: `color-mix(in srgb, ${ex.color} 14%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: ex.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{ex.tag}</div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  padding: '5px 10px', borderRadius: 99,
                  background: `color-mix(in srgb, ${ex.color} 11%, transparent)`, color: ex.color,
                }}>
                  {s.min} min
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setPlaying(true)}
          style={{
            marginTop: 18, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '15px', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer',
            background: 'var(--brand-teal)', color: '#000', fontSize: 16, fontWeight: 700,
            boxShadow: '0 6px 24px rgba(100,210,255,0.25)', minHeight: 50,
            transition: 'transform 0.25s var(--ease-out-expo), filter 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.012)'; e.currentTarget.style.filter = 'brightness(1.06)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
        >
          <Play size={18} /> Start {planTotal}-minute session
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 9 }}>
          Guided timers for every drill · pause, skip or end early — partial minutes still count
        </div>
      </div>

      {/* ── Weekly chart ── */}
      {loaded && (
        <div className="animate-in" style={{
          marginTop: 16, padding: '18px 20px 10px', borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Last 7 days</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>practice minutes</div>
          </div>
          <MFBarChart data={chartData} height={110} color="var(--brand-teal)" unit="m" emphasizeMax={false} highlightIndex={6} showTicks />
        </div>
      )}

      {/* ── Exercise library ── */}
      <div style={{ marginTop: 26 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          The science behind the drills
        </div>
        {CATS.map(cat => {
          const ids = Object.keys(EXERCISES).filter(k => EXERCISES[k].cat === cat)
          if (!ids.length) return null
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                {cat === 'Breath' && <Wind size={13} style={{ color: 'var(--brand-teal)' }} />}
                {cat === 'Warm-up' && <Volume2 size={13} style={{ color: 'var(--brand-primary)' }} />}
                {cat === 'Articulation' && <MessageSquare size={13} style={{ color: 'var(--brand-secondary)' }} />}
                {cat === 'Performance' && <Sparkles size={13} style={{ color: 'var(--pink)' }} />}
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ids.map(id => {
                  const included = Object.values(PLANS).filter(p => p.steps.some(s => s.ex === id))
                    .map(p => p.id + 'm').join(' · ')
                  return (
                    <LibraryCard
                      key={id} exId={id}
                      open={openLib === id}
                      onToggle={() => setOpenLib(openLib === id ? null : id)}
                      plansIncluding={included}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4, padding: '0 4px' }}>
          Grounded in clinical voice therapy (SOVT warm-ups — Titze, Journal of Voice), speech-language pathology
          articulation protocols, Linklater/Berry voice pedagogy for physical release, prosody research on vocal
          variety, and deliberate-practice findings for impromptu speaking (structured exposure, PREP framework,
          video self-review).
        </p>
      </div>

      {/* ── Player overlay ── */}
      {playing && (
        <SessionPlayer
          plan={plan}
          onExit={() => setPlaying(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
