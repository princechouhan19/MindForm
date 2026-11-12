import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Mic, Play, Pause, Square, RotateCcw, Timer, Wind, BookOpen, Video, VideoOff,
  Check, ChevronRight, X, Info, Sparkles, Volume2, Award, Zap, Waves,
  Camera, CameraOff, Circle, Glasses, Type,
} from 'lucide-react'
import { voiceAPI } from '../api/client'

/* ═══════════════════════════════════════════════════════════════
   Speak — Voice & Communication Studio
   Research-based drills (SOVT, diaphragmatic breathing, articulation
   ladders, style-shifting read-alouds, PREP impromptu framework),
   packaged as 15 / 30 / 60-minute guided sessions.
   Design: frontend/DESIGN.md — hairline cards, Action Blue, pills.
═══════════════════════════════════════════════════════════════ */

const LS_KEY = 'mf_speak_log_v1'
const MODULE_COLOR = 'var(--brand-teal)'

/* ── Research-backed exercise definitions ──────────────────── */
const EXERCISES = [
  {
    id: 'breathe', icon: Wind, color: 'var(--brand-teal)', minutes: '2–5',
    name: 'Diaphragm Breathing (4–2–6)',
    why: 'Slow diaphragmatic breathing lowers the larynx and steadies subglottal air pressure — the physical basis of a deeper, more resonant voice (Titze, Journal of Voice).',
    how: ['Sit tall, one hand on your belly.', 'Inhale through the nose for 4 counts — belly expands, chest stays quiet.', 'Hold for 2.', 'Exhale on a soft "sss" or "fff" for 6.', 'Repeat for the full round; follow the pacer.'],
  },
  {
    id: 'hum', icon: Waves, color: 'var(--brand-teal)', minutes: '3–8',
    name: 'SOVT Hum & Lip Trills',
    why: 'Semi-occluded vocal tract exercises (straw phonation, humming) back-build gentle pressure that reduces vocal-fold collision — the fastest known vocal warm-up (Titze).',
    how: ['Lips loose, teeth apart.', 'Hum a comfortable note — feel buzz on the lips and nose bridge.', 'Glide down, then glide up like a siren.', 'Follow with 5 lip trills on one breath.'],
  },
  {
    id: 'neck', icon: RotateCcw, color: 'var(--brand-teal)', minutes: '2–4',
    name: 'Neck Release + Long Vowels',
    why: 'Lengthened neck flexors and a released jaw free the larynx, removing the tension that raises pitch and thins tone (Linklater voice work).',
    how: ['Chin to chest, roll head side to side slowly.', 'On each stretch, sigh a long "ah — ee — oo".', 'Let the jaw hang heavy; no pushing.', 'Finish with two easy yawn-sighs.'],
  },
  {
    id: 'twister', icon: Type, color: 'var(--brand-teal)', minutes: '4–12',
    name: 'Tongue Twister Ladder',
    why: 'Speech-language pathology protocols use graded twisters (slow → precise → fast) to build tongue-lip coordination without losing clarity.',
    how: ['Pick your tier below.', 'Say it 3× slow — over-articulate every consonant.', 'Say it 5× at conversational speed.', 'Only go faster when it stays crisp.'],
  },
  {
    id: 'obstacle', icon: Glasses, color: 'var(--brand-teal)', minutes: '4–6',
    name: 'Obstacle Course (Pen / Over-Tongue)',
    why: 'Speaking with a pen in the mouth or tongue over-drilled forces exaggerated articulation; when the obstacle is removed, ordinary speech feels effortless and crisp.',
    how: ['Hold a pen lightly between your teeth.', 'Read a passage aloud for 60 seconds — over-enunciate.', 'Remove the pen and repeat the same lines.', 'Notice the immediate clarity gain.'],
  },
  {
    id: 'read', icon: BookOpen, color: 'var(--brand-teal)', minutes: '5–10',
    name: 'Style-Shifting Read-aloud',
    why: 'Reading one passage in six different styles trains prosody — pitch range, pacing and emphasis — the traits listeners rate as "charismatic" in speech studies.',
    how: ['Choose a passage and a style below.', 'Read it as directed — commit fully.', 'Re-read in a second contrasting style.', 'Mark the words you stressed differently.'],
  },
  {
    id: 'pace', icon: Timer, color: 'var(--brand-teal)', minutes: '3–4',
    name: 'Pace & Pause Trainer',
    why: 'Deliberate pauses before key points increase perceived competence and comprehension — professionals speak ~150 wpm, not 200+.',
    how: ['Follow the pacer: speak on the expanding ring.', 'At each pulse, insert a full beat of silence.', 'Practise ending sentences at the dot — not running on.'],
  },
  {
    id: 'camera', icon: Video, color: 'var(--brand-teal)', minutes: '5–10',
    name: 'Camera Studio (PREP Impromptu)',
    why: 'Speaking on camera under a light time structure is exposure training: PREP (Point–Reason–Example–Point) gives a mental scaffold so ideas land in order.',
    how: ['Draw a topic; get 30s to think in PREP.', 'State your Point in one sentence.', 'Give the Reason, then a concrete Example.', 'Restate the Point to close. Video stays on this device.'],
  },
]

/* ── Twister ladder (bronze → gold) ────────────────────────── */
const TWISTERS = {
  Bronze: [
    'Red lorry, yellow lorry, red lorry, yellow lorry.',
    'She sells sea shells by the sea shore.',
    'Good blood, bad blood, good blood, bad blood.',
    'Toy boat. Toy boat. Toy boat. Toy boat.',
    'Eleven benevolent elephants.',
    'Stupid superstition, stupid superstition.',
  ],
  Silver: [
    'Peter Piper picked a peck of pickled peppers.',
    'Betty better butter Brad\'s bread.',
    'A proper copper coffee pot.',
    'Six slippery snails slid slowly seaward.',
    'Fresh French fried fly fritters.',
    'Brisk brave brigadiers brandished broad bright blades.',
  ],
  Gold: [
    'The sixth sick sheikh\'s sixth sheep\'s sick.',
    'Imagine an imaginary menagerie manager imagining managing an imaginary menagerie.',
    'Irish wristwatch. Irish wristwatch. Irish wristwatch.',
    'Six crisp, slick, stick-shifts.',
    'The thirty-three thieves thought that they thrilled the throne throughout Thursday.',
    'A rough-coated, dough-faced, thoughtful ploughman strode through the streets of Scarborough.',
  ],
}

/* ── Read-aloud passages (original texts) ──────────────────── */
const PASSAGES = [
  {
    id: 'arrival', title: 'The Arrival — narrative',
    text: 'The train arrived four minutes late, as it always did on Thursdays. Mara stepped onto the platform with one suitcase and a letter she had read so many times the folds had turned to thread. The town smelled of rain and iron. Somewhere beyond the bridge, a lighthouse was waiting for a keeper — and she had decided, somewhere between two cities, that the keeper would be her.',
  },
  {
    id: 'coffee', title: 'How Coffee Conquered the World — expository',
    text: 'Coffee began as a regional curiosity in the highlands of Ethiopia and became, within four centuries, the second most traded commodity on earth. Its rise was never accidental. Merchants carried it, empires taxed it, and scientists argued over it. What coffee really sold was not flavour but a promise: that the morning could be engineered, and that attention could be brewed on demand.',
  },
  {
    id: 'lighthouse', title: 'The Keeper\'s Promise — dialogue-driven',
    text: '"You\'ll be alone up there," the inspector warned. "Most people can\'t manage it." The keeper smiled and lit the lamp. "Alone is a strong word," he said. "There are ships. There is weather. And every night, there is someone out there counting on the light to be exactly where it says it will be. That\'s not solitude — that\'s an appointment."',
  },
]

/* ── Six prosody styles ────────────────────────────────────── */
const STYLES = [
  { id: 'doc', name: 'Documentary Calm', cue: 'Low, measured, unhurried. Let consonants land softly. Almost a whisper of authority — David Attenborough energy.' },
  { id: 'talk', name: 'Late-Night Talk Show', cue: 'Playful, connected, smiling through the voice. Punch the fun words, pause for the imagined laugh.' },
  { id: 'news', name: 'Breaking News', cue: 'Crisp, urgent, front-of-mouth. Tight pace, clear headlines energy, but never shouty.' },
  { id: 'audio', name: 'Audiobook Storyteller', cue: 'Warm, intimate, forward motion. Different colour for each character; drop volume to draw the listener in.' },
  { id: 'keynote', name: 'Motivational Keynote', cue: 'Anchored stance, generous volume, slow on the big lines. Silence after the sentence that matters.' },
  { id: 'asmr', name: 'Library Whisper', cue: 'Barely-there volume, slow, velvety. The listener is one metre away; articulate everything.' },
]

/* ── Impromptu topics (camera studio) ──────────────────────── */
const TOPICS = [
  'The habit that changed my mornings most',
  'Why boring routines beat bursts of motivation',
  'A skill everyone should learn before 30',
  'The best advice I ever ignored',
  'What I would tell my first-day self',
  'The most underrated luxury is free',
  'How I decide what deserves my attention',
  'A mistake that taught me more than success',
  'The case for doing things slowly',
  'One purchase under $20 that improved my life',
  'Why I track things on paper first',
  'The compliment that stuck with me',
]

const PREP = [
  { k: 'P', t: 'Point', d: 'Your claim in one clean sentence.' },
  { k: 'R', t: 'Reason', d: 'Why it holds — the because.' },
  { k: 'E', t: 'Example', d: 'A specific, concrete story or number.' },
  { k: 'P', t: 'Point', d: 'Restate the point. Land the plane.' },
]

/* ── Guided plans: 15 / 30 / 60 minutes ────────────────────── */
const PLANS = {
  15: {
    label: '15 minutes', tag: 'Daily maintenance',
    steps: [
      { ex: 'breathe', min: 2 }, { ex: 'hum', min: 3 }, { ex: 'neck', min: 2 },
      { ex: 'twister', min: 4 }, { ex: 'read', min: 3 }, { ex: 'camera', min: 1 },
    ],
  },
  30: {
    label: '30 minutes', tag: 'Full workout',
    steps: [
      { ex: 'breathe', min: 3 }, { ex: 'hum', min: 5 }, { ex: 'neck', min: 3 },
      { ex: 'twister', min: 7 }, { ex: 'obstacle', min: 4 }, { ex: 'read', min: 5 }, { ex: 'camera', min: 3 },
    ],
  },
  60: {
    label: '1 hour', tag: 'Deep practice',
    steps: [
      { ex: 'breathe', min: 5 }, { ex: 'hum', min: 8 }, { ex: 'neck', min: 5 },
      { ex: 'twister', min: 12 }, { ex: 'obstacle', min: 6 }, { ex: 'read', min: 10 },
      { ex: 'pace', min: 4 }, { ex: 'camera', min: 10 },
    ],
  },
}

const exById = (id) => EXERCISES.find(e => e.id === id)

/* ═══════════════════════════════════════════════════════════════
   Practice tools
══════════════════════════════════════════════════════════════ */

/* Breathing pacer — 4-2-6 visual guide */
function BreathingPacer({ running = true }) {
  const [phase, setPhase] = useState(0) // 0 inhale, 1 hold, 2 exhale
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setT(prev => {
        const dur = [4, 2, 6][phase]
        if (prev + 0.1 >= dur) { setPhase(p => (p + 1) % 3); return 0 }
        return prev + 0.1
      })
    }, 100)
    return () => clearInterval(iv)
  }, [phase, running])
  const labels = ['Inhale — nose', 'Hold', 'Exhale — soft "sss"']
  const scale = phase === 0 ? 0.55 + (t / 4) * 0.45 : phase === 1 ? 1 : 1 - (t / 6) * 0.45
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '22px 0 8px' }}>
      <div style={{
        width: 128, height: 128, borderRadius: '50%',
        border: `2px solid ${MODULE_COLOR}`,
        background: `color-mix(in srgb, ${MODULE_COLOR} 10%, transparent)`,
        transform: `scale(${running ? scale : 0.8})`,
        transition: 'transform 0.12s linear',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{(4 - Math.floor(t) + (phase === 0 ? 0 : 0)) || ''}{phase === 0 ? Math.max(1, 4 - Math.floor(t)) : phase === 1 ? Math.max(1, 2 - Math.floor(t)) : Math.max(1, 6 - Math.floor(t))}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>{running ? labels[phase] : 'Press play to begin'}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[4, 2, 6].map((d, i) => (
          <span key={i} style={{
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 980,
            background: i === phase && running ? MODULE_COLOR : 'var(--bg-glass)',
            color: i === phase && running ? '#000' : 'var(--text-muted)',
          }}>{d}s</span>
        ))}
      </div>
    </div>
  )
}

/* Small circular play/stop control — 44px chip */
function PlayChip({ playing, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={playing ? 'Stop' : 'Start'}
      style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'var(--btn-primary-bg)', color: '#fff', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      {playing ? <Square size={15} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
    </button>
  )
}

/* Read / camera countdown ring */
function CountRing({ seconds, total, size = 44, color = 'var(--brand-primary)' }) {
  const pct = total ? Math.max(0, Math.min(1, seconds / total)) : 0
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{seconds}</div>
    </div>
  )
}

/* Tongue twister deck */
function TwisterDeck() {
  const tiers = Object.keys(TWISTERS)
  const [tier, setTier] = useState('Bronze')
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState({})
  const list = TWISTERS[tier]
  const text = list[idx % list.length]
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {tiers.map(tn => (
          <button key={tn} onClick={() => { setTier(tn); setIdx(0) }}
            style={{
              padding: '6px 14px', borderRadius: 980, fontSize: 13, fontWeight: 600,
              border: `1px solid ${tier === tn ? MODULE_COLOR : 'var(--border)'}`,
              background: tier === tn ? `color-mix(in srgb, ${MODULE_COLOR} 14%, transparent)` : 'transparent',
              color: tier === tn ? MODULE_COLOR : 'var(--text-secondary)',
            }}>{tn}</button>
        ))}
      </div>
      <div className="app-card" style={{ padding: 20, marginBottom: 12 }}>
        <div className="app-eyebrow" style={{ marginBottom: 8 }}>{tier} · {String((idx % list.length) + 1).padStart(2, '0')} of {list.length}</div>
        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.022em' }}>{text}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="app-eyebrow" style={{ alignSelf: 'center' }}>3× slow · 5× fast</span>
        <div style={{ flex: 1 }} />
        <button className="app-btn-utility" onClick={() => setIdx(i => i + 1)}>
          <RotateCcw size={14} /> Next
        </button>
        <button className="app-btn-primary" style={{ padding: '8px 18px', minHeight: 36, fontSize: 14 }}
          onClick={() => setDone(d => ({ ...d, [`${tier}-${idx}`]: true }))}>
          {done[`${tier}-${idx}`] ? <><Check size={14} /> Nailed it</> : 'Mark complete'}
        </button>
      </div>
    </div>
  )
}

/* Style-shifting read-aloud */
function ReadingDrill() {
  const [pid, setPid] = useState(PASSAGES[0].id)
  const [sid, setSid] = useState(STYLES[0].id)
  const [obstacle, setObstacle] = useState(false)
  const passage = PASSAGES.find(p => p.id === pid)
  const style = STYLES.find(s => s.id === sid)
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {PASSAGES.map(p => (
          <button key={p.id} onClick={() => setPid(p.id)}
            style={{
              padding: '6px 13px', borderRadius: 980, fontSize: 12.5, fontWeight: 600,
              border: `1px solid ${pid === p.id ? MODULE_COLOR : 'var(--border)'}`,
              background: pid === p.id ? `color-mix(in srgb, ${MODULE_COLOR} 14%, transparent)` : 'transparent',
              color: pid === p.id ? MODULE_COLOR : 'var(--text-secondary)',
            }}>{p.title.split('—')[0].trim()}</button>
        ))}
      </div>
      <div className="app-card" style={{ padding: 20, marginBottom: 12 }}>
        <div className="app-eyebrow" style={{ marginBottom: 10 }}>Read in: {style.name}</div>
        <p style={{ fontSize: 16, lineHeight: 1.6, letterSpacing: '-0.016em', color: 'var(--text-primary)', marginBottom: 12 }}>{passage.text}</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)' }}>
          <Info size={14} style={{ color: MODULE_COLOR, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{style.cue}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {STYLES.map(s => (
          <button key={s.id} onClick={() => setSid(s.id)}
            style={{
              padding: '5px 12px', borderRadius: 980, fontSize: 12, fontWeight: 600,
              border: `1px solid ${sid === s.id ? MODULE_COLOR : 'var(--border)'}`,
              background: sid === s.id ? `color-mix(in srgb, ${MODULE_COLOR} 14%, transparent)` : 'transparent',
              color: sid === s.id ? MODULE_COLOR : 'var(--text-muted)',
            }}>{s.name}</button>
        ))}
      </div>
      <button className="app-btn-secondary" style={{ padding: '8px 16px', minHeight: 38, fontSize: 13.5 }}
        onClick={() => setObstacle(o => !o)}>
        <Glasses size={14} /> {obstacle ? 'Remove obstacle' : 'Obstacle round — pen in mouth'}
      </button>
      {obstacle && (
        <div style={{ marginTop: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Hold a pen between your teeth, read the passage once, then repeat without it. Compare.
        </div>
      )}
    </div>
  )
}

/* Pace & pause trainer */
function PaceTrainer() {
  const [on, setOn] = useState(false)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (!on) return
    const iv = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 450)
    }, 2200)
    return () => clearInterval(iv)
  }, [on])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0 8px' }}>
      <div style={{
        width: 140, height: 140, borderRadius: '50%',
        border: `2px solid ${pulse ? MODULE_COLOR : 'var(--border)'}`,
        background: pulse ? `color-mix(in srgb, ${MODULE_COLOR} 12%, transparent)` : 'transparent',
        transform: pulse ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.4s var(--ease-out-expo)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 2,
      }}>
        <Volume2 size={18} style={{ color: pulse ? MODULE_COLOR : 'var(--text-muted)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: pulse ? MODULE_COLOR : 'var(--text-muted)' }}>{pulse ? 'SPEAK' : 'PAUSE'}</span>
      </div>
      <p className="lp-caption" style={{ fontSize: 13.5, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 320 }}>
        Speak while the ring is lit. At each pulse, stop for a full beat of silence before continuing.
      </p>
      <PlayChip playing={on} onClick={() => setOn(o => !o)} />
    </div>
  )
}

/* On-camera studio — 100% local, nothing uploads */
function CameraStudio() {
  const videoRef = useRef(null)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const [camOn, setCamOn] = useState(false)
  const [camErr, setCamErr] = useState('')
  const [recording, setRecording] = useState(false)
  const [clipUrl, setClipUrl] = useState(null)
  const [topic, setTopic] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | prep | speak
  const [left, setLeft] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!camOn) return
    let stream = null
    navigator.mediaDevices?.getUserMedia({ video: { width: 960 }, audio: true })
      .then(s => { stream = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}) } })
      .catch(() => setCamErr('Camera unavailable — check browser permission.'))
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [camOn])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const begin = (secs, ph) => {
    clearInterval(timerRef.current)
    setLeft(secs)
    setPhase(ph)
    timerRef.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(timerRef.current)
          setPhase('idle')
          stopRec()
          return 0
        }
        return l - 1
      })
    }, 1000)
  }

  const startRec = () => {
    try {
      const stream = videoRef.current?.srcObject
      if (!stream) return
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'video/webm' })
        setClipUrl(URL.createObjectURL(blob))
      }
      mr.start()
      recRef.current = mr
      setRecording(true)
    } catch { /* recording unsupported */ }
  }
  const stopRec = () => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    setRecording(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="app-card" style={{ padding: '10px 16px', flex: 1, minWidth: 220 }}>
          <div className="app-eyebrow" style={{ marginBottom: 3 }}>Today’s topic</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.016em' }}>{TOPICS[topic]}</div>
        </div>
        <button className="app-btn-utility" onClick={() => setTopic(t => (t + 1) % TOPICS.length)}>
          <Sparkles size={14} /> Shuffle
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 10, marginBottom: 12 }}>
        {PREP.map((p, i) => (
          <div key={i} className="app-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: MODULE_COLOR, color: '#000',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{p.k}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.t}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.d}</div>
          </div>
        ))}
      </div>

      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: '#000', border: '1px solid var(--border)', aspectRatio: '16 / 9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        {camOn ? (
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <VideoOff size={26} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {camErr || 'Camera off — your video never leaves this device.'}
            </div>
            <button className="app-btn-primary" style={{ padding: '9px 20px', minHeight: 40, fontSize: 14 }} onClick={() => { setCamErr(''); setCamOn(true) }}>
              <Camera size={15} /> Turn camera on
            </button>
          </div>
        )}
        {camOn && (phase !== 'idle') && (
          <div style={{
            position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'saturate(180%) blur(20px)',
            borderRadius: 980, padding: '6px 12px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{phase === 'prep' ? 'Prepare' : 'Speak'}</span>
            <CountRing seconds={left} total={phase === 'prep' ? 30 : 60} color={phase === 'prep' ? '#ffd60a' : '#ff453a'} size={34} />
          </div>
        )}
        {camOn && recording && (
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 980, padding: '6px 12px' }}>
            <Circle size={9} fill="#ff453a" stroke="none" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.04em' }}>REC — local only</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {camOn && (
          <button className="app-btn-secondary" style={{ padding: '8px 16px', minHeight: 38, fontSize: 13.5 }} onClick={() => { setCamOn(false); stopRec(); setClipUrl(null) }}>
            <CameraOff size={14} /> Camera off
          </button>
        )}
        <button className="app-btn-utility" disabled={phase !== 'idle'}
          onClick={() => begin(30, 'prep')}
          style={phase !== 'idle' ? { opacity: 0.5, cursor: 'default' } : null}>
          <Timer size={14} /> 30s prep
        </button>
        <button className="app-btn-primary" style={{ padding: '8px 20px', minHeight: 38, fontSize: 14 }}
          onClick={() => { if (camOn) startRec(); begin(60, 'speak') }}>
          <Mic size={14} /> Speak 60s
        </button>
        {recording && (
          <button className="app-btn-utility" onClick={stopRec}><Square size={13} /> Stop</button>
        )}
      </div>

      {clipUrl && (
        <div style={{ marginTop: 14 }}>
          <div className="app-eyebrow" style={{ marginBottom: 8 }}>Your take — review, then discard</div>
          <video src={clipUrl} controls style={{ width: '100%', maxHeight: 300, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          <button className="app-link" style={{ marginTop: 8, fontSize: 13.5 }} onClick={() => { URL.revokeObjectURL(clipUrl); setClipUrl(null) }}>
            Discard recording
          </button>
        </div>
      )}
    </div>
  )
}

/* Neck release sequence */
function NeckVowels() {
  const STEPS = [
    'Chin to chest — sigh a long "ah"',
    'Roll right ear toward shoulder — "ee"',
    'Roll left ear toward shoulder — "oo"',
    'Half-circle back through centre — "ay"',
    'Gentle yawn-sigh, jaw loose',
    'Two normal breaths — feel the difference',
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (i >= STEPS.length) return
    const t = setTimeout(() => setI(v => Math.min(v + 1, STEPS.length)), 8000)
    return () => clearTimeout(t)
  }, [i])
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STEPS.map((s, k) => (
          <div key={k} className="app-card" style={{
            padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderColor: i === k ? MODULE_COLOR : 'var(--border)',
            opacity: k > i ? 0.45 : 1,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: k < i ? MODULE_COLOR : 'transparent',
              border: `1.5px solid ${k < i ? MODULE_COLOR : 'var(--border-bright)'}`,
              color: '#000', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{k < i ? <Check size={12} /> : k + 1}</span>
            <span style={{ fontSize: 14.5, fontWeight: k === i ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>
      <button className="app-link" style={{ marginTop: 10, fontSize: 13.5 }} onClick={() => setI(0)}>
        <RotateCcw size={13} /> Restart sequence
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Session player — guided 15 / 30 / 60 plan
══════════════════════════════════════════════════════════════ */
function SessionPlayer({ plan, onClose, onFinish }) {
  const steps = PLANS[plan].steps
  const [i, setI] = useState(0)
  const [sec, setSec] = useState(steps[0].min * 60)
  const [running, setRunning] = useState(true)
  const [done, setDone] = useState(false)
  const totalSec = steps.reduce((a, s) => a + s.min * 60, 0)
  const elapsedBefore = steps.slice(0, i).reduce((a, s) => a + s.min * 60, 0)
  const remaining = totalSec - elapsedBefore - (steps[i] ? steps[i].min * 60 - sec : 0)
  const pct = Math.max(0, Math.min(100, ((totalSec - remaining) / totalSec) * 100))
  const ex = exById(steps[i]?.ex)

  useEffect(() => {
    if (!running || done) return
    const iv = setInterval(() => {
      setSec(s => {
        if (s <= 1) {
          if (i < steps.length - 1) {
            setI(k => k + 1)
            return steps[i + 1].min * 60
          }
          clearInterval(iv)
          setDone(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [running, done, i, steps])

  const mmss = v => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120, background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s var(--ease-out-expo)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{PLANS[plan].label} session</div>
        <button onClick={onClose} aria-label="Close session" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>
      </div>

      {done ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: `color-mix(in srgb, ${MODULE_COLOR} 15%, transparent)`, border: `1.5px solid ${MODULE_COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={30} style={{ color: MODULE_COLOR }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.022em' }}>Session complete.</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 380, lineHeight: 1.5 }}>
            {plan} minutes of deliberate voice work, logged. Your instrument is warmed, your articulation is awake — carry it into your next conversation.
          </p>
          <button className="app-btn-primary" style={{ marginTop: 8 }} onClick={onFinish}>Done</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px' }}>
          {/* progress ring */}
          <div style={{ position: 'relative', width: 148, height: 148, marginBottom: 24 }}>
            <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={74} cy={74} r={66} fill="none" stroke="var(--border)" strokeWidth={7} />
              <circle cx={74} cy={74} r={66} fill="none" stroke={MODULE_COLOR} strokeWidth={7} strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 66} ${2 * Math.PI * 66}`}
                style={{ transition: 'stroke-dasharray 0.5s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{mmss(sec)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>step {i + 1} of {steps.length}</span>
            </div>
          </div>

          {/* current step card */}
          <div className="app-card" style={{ width: 'min(560px, 100%)', padding: 24, textAlign: 'center' }}>
            <div className="app-eyebrow" style={{ marginBottom: 8 }}>{ex?.name}</div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>
              {ex?.how[0]} {ex?.minutes && <span style={{ color: 'var(--text-muted)' }}>· target {steps[i].min} min</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button className="app-btn-secondary" style={{ padding: '8px 16px', minHeight: 40, fontSize: 14 }} onClick={() => setRunning(r => !r)}>
                {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
              </button>
              <button className="app-btn-utility" onClick={() => {
                if (i < steps.length - 1) { setI(i + 1); setSec(steps[i + 1].min * 60) }
                else { setDone(true) }
              }}>
                Skip <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* step rail */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22, maxWidth: 560 }}>
            {steps.map((s, k) => (
              <span key={k} title={exById(s.ex)?.name}
                style={{
                  height: 6, borderRadius: 3, flex: `1 1 ${s.min * 8}px`, minWidth: 22,
                  background: k < i ? MODULE_COLOR : k === i ? `color-mix(in srgb, ${MODULE_COLOR} 55%, transparent)` : 'var(--border)',
                }} />
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>
            {mmss(remaining)} remaining in session
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main view
══════════════════════════════════════════════════════════════ */
export default function VoiceCoachView() {
  const [log, setLog] = useState([])
  const [plan, setPlan] = useState(15)
  const [player, setPlayer] = useState(false)
  const [openEx, setOpenEx] = useState(null)   // exercise detail / tool
  const [saving, setSaving] = useState(false)

  /* load: server first, localStorage fallback */
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await voiceAPI.get()
        if (alive && r?.data?.sessions?.length) { setLog(r.data.sessions); return }
        throw new Error('empty')
      } catch {
        try {
          const raw = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
          if (alive) setLog(Array.isArray(raw) ? raw : [])
        } catch { /* ignore */ }
      }
    })()
    return () => { alive = false }
  }, [])

  const persist = useCallback(async (sessions) => {
    setSaving(true)
    try { await voiceAPI.update({ sessions }) } catch { /* offline: local only */ }
    try { localStorage.setItem(LS_KEY, JSON.stringify(sessions.slice(-500))) } catch { /* private mode */ }
    setSaving(false)
  }, [])

  const completeSession = useCallback((mins) => {
    const entry = { ex: 'session', plan: mins, min: mins, at: new Date().toISOString() }
    setLog(prev => {
      const next = [...prev, entry].slice(-500)
      persist(next)
      return next
    })
  }, [persist])

  const finishPlayer = () => {
    completeSession(plan)
    setPlayer(false)
  }

  /* stats */
  const weekAgo = Date.now() - 7 * 86400000
  const weekSessions = log.filter(s => new Date(s.at).getTime() > weekAgo)
  const weekMin = weekSessions.reduce((a, s) => a + (s.min || 0), 0)
  const totalMin = log.reduce((a, s) => a + (s.min || 0), 0)
  const perEx = useMemo(() => {
    const m = {}
    log.forEach(s => { if (s.ex && s.ex !== 'session') m[s.ex] = (m[s.ex] || 0) + (s.min || 0) })
    return m
  }, [log])

  return (
    <div className="view-scroll" style={{ padding: '0 clamp(16px,3vw,32px) 60px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '28px 6px 10px' }}>
        <div className="app-eyebrow">Speak &amp; presence</div>
        <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.022em', marginTop: 6, marginBottom: 4 }}>
          Voice &amp; Communication Studio.
        </h1>
        <p style={{ fontSize: 15.5, color: 'var(--text-secondary)' }}>
          Research-based drills for a clearer, deeper, more confident voice — in 15, 30 or 60 focused minutes.
        </p>
      </div>

      {/* Plan picker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12, marginTop: 18 }}>
        {[15, 30, 60].map(p => {
          const active = plan === p
          const pl = PLANS[p]
          return (
            <button key={p} className="app-card app-card-hover" onClick={() => setPlan(p)}
              style={{
                padding: '18px 20px', textAlign: 'left', cursor: 'pointer', width: '100%',
                borderColor: active ? MODULE_COLOR : 'var(--border)',
                background: active ? `color-mix(in srgb, ${MODULE_COLOR} 7%, var(--bg-card))` : 'var(--bg-card)',
                fontFamily: 'var(--font-body)', color: 'var(--text-primary)',
              }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em' }}>{pl.label}</span>
                {active && <Check size={16} style={{ color: MODULE_COLOR }} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: MODULE_COLOR, marginTop: 2 }}>{pl.tag}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {pl.steps.length} steps · {pl.steps.map(s => s.min).join(' · ')} min
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="app-btn-primary" style={{ padding: '12px 26px', fontSize: 15 }} onClick={() => setPlayer(true)}>
          <Play size={15} fill="currentColor" /> Start {PLANS[plan].label} session
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {saving ? 'Saving…' : `${log.length} sessions logged · ${totalMin} total minutes`}
        </span>
      </div>

      {/* Week strip */}
      <div className="app-card" style={{ padding: '16px 20px', marginTop: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div className="app-eyebrow" style={{ marginBottom: 4 }}>This week</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.022em', fontVariantNumeric: 'tabular-nums' }}>
            {weekSessions.length}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> sessions</span>
          </div>
        </div>
        <div>
          <div className="app-eyebrow" style={{ marginBottom: 4 }}>Minutes</div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.022em', fontVariantNumeric: 'tabular-nums' }}>
            {weekMin}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="app-eyebrow" style={{ marginBottom: 6 }}>Focus mix (all time)</div>
          <div style={{ display: 'flex', gap: 4, height: 8 }}>
            {EXERCISES.map(e => {
              const v = perEx[e.id] || 0
              const tot = Math.max(1, Object.values(perEx).reduce((a, b) => a + b, 0))
              return <div key={e.id} title={`${e.name}: ${v}m`} style={{
                flex: Math.max(v, 0.15), borderRadius: 4,
                background: v > 0 ? MODULE_COLOR : 'var(--border)',
                opacity: v > 0 ? 0.35 + 0.65 * (v / tot) : 1,
              }} />
            })}
          </div>
        </div>
      </div>

      {/* Exercise library */}
      <div className="app-eyebrow" style={{ margin: '26px 0 12px' }}>Exercise library — the science</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 12 }}>
        {EXERCISES.map(ex => {
          const open = openEx === ex.id
          const Icon = ex.icon
          return (
            <div key={ex.id} className="app-card app-card-hover" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: `color-mix(in srgb, ${ex.color} 13%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${ex.color} 26%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} style={{ color: ex.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.016em' }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.minutes} min</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-secondary)', marginBottom: open ? 12 : 0 }}>
                {ex.why}
              </p>
              {open && (
                <ol style={{ margin: '0 0 14px 18px', padding: 0 }}>
                  {ex.how.map((h, k) => (
                    <li key={k} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>{h}</li>
                  ))}
                </ol>
              )}
              {/* inline tool */}
              {open && ex.id === 'breathe' && <BreathingPacer />}
              {open && ex.id === 'twister' && <div style={{ marginBottom: 14 }}><TwisterDeck /></div>}
              {open && ex.id === 'read' && <div style={{ marginBottom: 14 }}><ReadingDrill /></div>}
              {open && ex.id === 'neck' && <div style={{ marginBottom: 14 }}><NeckVowels /></div>}
              {open && ex.id === 'pace' && <PaceTrainer />}
              {open && ex.id === 'camera' && <div style={{ marginBottom: 4 }}><CameraStudio /></div>}
              {open && ex.id === 'hum' && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    Follow the pattern: hum low → glide down → glide up → 5 lip trills. Two minutes each, gentle breath between.
                  </p>
                  <BreathingPacer />
                </div>
              )}
              {open && ex.id === 'obstacle' && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    Two rounds only. Round one with the pen, round two without — same lines. Over-articulation is the whole point; accuracy beats speed.
                  </p>
                </div>
              )}
              <button className="app-link" style={{ fontSize: 13.5 }} onClick={() => setOpenEx(open ? null : ex.id)}>
                {open ? 'Show less' : 'How to practise'} <ChevronRight size={13} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Privacy note */}
      <div className="app-card" style={{ marginTop: 18, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Zap size={15} style={{ color: MODULE_COLOR, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Session minutes sync to your account; camera video and audio are processed locally by your browser and are never uploaded.
        </span>
      </div>

      {player && <SessionPlayer plan={plan} onClose={() => setPlayer(false)} onFinish={finishPlayer} />}
    </div>
  )
}
