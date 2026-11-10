// Shared aura/level engine — single source of truth for the whole platform.
// Used by faplessController (GET), social leaderboard and public profiles so
// every surface shows identical numbers (previously they disagreed wildly).

const LEVELS = [
  { id: 'clown',         label: 'Day One',            minDays: 0,   maxDays: 0,        auraPerDay: 0 },
  { id: 'noob',          label: 'Initiate',           minDays: 1,   maxDays: 6,        auraPerDay: 10 },
  { id: 'novice',        label: 'Novice',             minDays: 7,   maxDays: 13,       auraPerDay: 20 },
  { id: 'average',       label: 'Average',            minDays: 14,  maxDays: 29,       auraPerDay: 35 },
  { id: 'advanced',      label: 'Advanced',           minDays: 30,  maxDays: 44,       auraPerDay: 55 },
  { id: 'sigma',         label: 'Sigma',              minDays: 45,  maxDays: 59,       auraPerDay: 80 },
  { id: 'chad',          label: 'Chad',               minDays: 60,  maxDays: 89,       auraPerDay: 110 },
  { id: 'absolute_chad', label: 'Absolute Chad',      minDays: 90,  maxDays: 119,      auraPerDay: 150 },
  { id: 'gigachad',      label: 'Giga Chad',          minDays: 120, maxDays: 364,      auraPerDay: 200 },
  { id: 'abs_gigachad',  label: 'Absolute Giga Chad', minDays: 365, maxDays: Infinity, auraPerDay: 365 },
]

// Aura earned per resisted urge (mastery experience — the strongest source
// of self-efficacy in behaviour-change research)
const URGE_AURA = 15

const MILESTONES = [
  { day: 1,   label: 'First Step',            bonus: 50 },
  { day: 3,   label: 'Urge Breaker',          bonus: 100 },
  { day: 7,   label: 'One Week Strong',       bonus: 250 },
  { day: 14,  label: 'Fortnight Freedom',     bonus: 500 },
  { day: 30,  label: 'Monthly Mastery',       bonus: 1000 },
  { day: 45,  label: 'Sigma Transcended',     bonus: 1500 },
  { day: 60,  label: 'Chad Awakening',        bonus: 2000 },
  { day: 90,  label: 'Full Brain Reboot',     bonus: 3000 },
  { day: 120, label: 'Elite Focus',           bonus: 5000 },
  { day: 180, label: 'Diamond Shield',        bonus: 8000 },
  { day: 365, label: 'The Annual Ascendant',  bonus: 15000 },
]

const CHALLENGES = {
  NNN:      { duration: 30,  auraBonus: 500 },
  NYR:      { duration: 30,  auraBonus: 500 },
  '30day':  { duration: 30,  auraBonus: 300 },
  '90day':  { duration: 90,  auraBonus: 1200 },
  '180day': { duration: 180, auraBonus: 3000 },
  year:     { duration: 365, auraBonus: 9999 },
  hardmode: { duration: 90,  auraBonus: 2000 },
}

function getLevel(days) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (days >= LEVELS[i].minDays) return LEVELS[i]
  }
  return LEVELS[0]
}

function calcStreakAura(days) {
  // Count each day exactly once, by the level range it falls into.
  // (The old version never advanced a cursor, so every level's full span
  // was summed — a 5-day streak earned ~3,300 aura instead of ~50.)
  let aura = 0
  for (const lvl of LEVELS) {
    if (lvl.auraPerDay <= 0) continue
    const levelStart = Math.max(lvl.minDays, 1) // day 0 earns nothing
    const levelEnd = lvl.maxDays === Infinity ? days : Math.min(days, lvl.maxDays)
    const daysInLevel = levelEnd - levelStart + 1
    if (daysInLevel > 0) aura += daysInLevel * lvl.auraPerDay
  }
  return aura
}

function calcMilestoneAura(days) {
  return MILESTONES.filter(m => days >= m.day).reduce((sum, m) => sum + m.bonus, 0)
}

function calcChallengeBonus(activeChallengeId, days) {
  const ch = CHALLENGES[activeChallengeId]
  if (!ch || days < ch.duration) return 0
  return ch.auraBonus
}

/**
 * Canonical stats for a fapless record.
 * @param {object} doc - Fapless mongoose doc (or lean object)
 * @param {number} [atMs] - evaluation timestamp (defaults to now)
 * @returns {{streakDays:number, aura:number, level:{id,label}|null, auraRate:number}}
 */
function computeStreakStats(doc, atMs = Date.now()) {
  if (!doc?.startDate) {
    return { streakDays: 0, aura: 0, level: null, auraRate: 0 }
  }
  const totalMs = atMs - new Date(doc.startDate).getTime()
  const streakDays = Math.max(0, Math.floor(totalMs / 86400000))
  const level = getLevel(streakDays)

  const streakAura = calcStreakAura(streakDays)
  const milestoneAura = calcMilestoneAura(streakDays)
  const challengeBonus = calcChallengeBonus(doc.activeChallenge, streakDays)
  const relapseBonus = (doc.relapses || []).reduce((acc, r) => acc + (r.bonusEarned || 0), 0)
  const urgeAura = (doc.urgeLogs || []).filter(u => u.resisted).length * URGE_AURA

  const aura = streakAura + milestoneAura + challengeBonus + relapseBonus + urgeAura
  const urgesResisted = (doc.urgeLogs || []).filter(u => u.resisted).length
  return { streakDays, aura, level: { id: level.id, label: level.label }, auraRate: level.auraPerDay, urgesResisted, urgeAura }
}

module.exports = { LEVELS, MILESTONES, CHALLENGES, URGE_AURA, getLevel, computeStreakStats }
