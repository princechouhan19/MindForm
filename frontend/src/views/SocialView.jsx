import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy, Users, MessageCircle, Globe, Lock, Eye, EyeOff, Send,
  UserCheck, UserPlus, Star, Shield, Crown, Flame, Zap, ChevronRight,
  Settings2, Trash2, Check, X, AlertCircle, Loader2
} from 'lucide-react'
import { socialAPI, adminAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

// ── Country flag emoji from ISO code ─────────────────────────────────────────
const flag = (code) => {
  if (!code || code.length !== 2) return '🌍'
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397))
}

// ── Country list (abbreviated) ────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'NG', name: 'Nigeria' }, { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' }, { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' }, { code: 'EG', name: 'Egypt' },
  { code: 'RU', name: 'Russia' }, { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' }, { code: 'AR', name: 'Argentina' },
  { code: 'TR', name: 'Turkey' }, { code: 'NL', name: 'Netherlands' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'AE', name: 'UAE' },
  { code: 'SG', name: 'Singapore' }, { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' }, { code: 'VN', name: 'Vietnam' },
]

// ── Shared styles ─────────────────────────────────────────────────────────────
const CARD = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
}

const BTN = (variant = 'primary') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
  ...(variant === 'primary' ? {
    background: 'linear-gradient(135deg, var(--cyan), #0077ff)',
    color: '#000',
  } : variant === 'danger' ? {
    background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.4)',
    color: 'var(--red)',
  } : {
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  }),
})

// ── Badge pill component ───────────────────────────────────────────────────────
function BadgePill({ badge }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
      background: `${badge.color}20`, border: `1px solid ${badge.color}55`,
      color: badge.color, letterSpacing: '0.02em',
    }}>
      {badge.emoji} {badge.label}
    </span>
  )
}

// ── Profile Card (mini) ───────────────────────────────────────────────────────
function MiniProfile({ user, streakDays = 0, aura = 0, rank, onClick, isFollowing, onFollow }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.transform = 'translateX(3px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
    >
      {rank !== undefined && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: rank === 0 ? '#FFD70030' : rank === 1 ? '#C0C0C030' : rank === 2 ? '#CD7F3230' : 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : rank === 2 ? '#CD7F32' : 'var(--text-muted)',
        }}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0, border: '2px solid var(--border)',
      }}>
        {user.avatar || user.name?.[0]?.toUpperCase() || '?'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</span>
          {user.country && <span>{flag(user.country)}</span>}
          {user.badges?.slice(0, 2).map(b => <BadgePill key={b.id} badge={b} />)}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: '#ff4500', fontWeight: 700 }}>🔥 {streakDays}d</span>
          <span style={{ fontSize: 12, color: '#ffd700', fontWeight: 700 }}>⚡ {aura.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onFollow && (
          <button
            onClick={e => { e.stopPropagation(); onFollow() }}
            style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), padding: '6px 12px', fontSize: 12 }}
          >
            {isFollowing ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
          </button>
        )}
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN SOCIAL VIEW ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function SocialView() {
  const { user } = useAuth()
  const [tab, setTab] = useState('leaderboard')
  const [profile, setProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [forumMsgs, setForumMsgs] = useState([])
  const [viewProfile, setViewProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [followList, setFollowList] = useState(new Set())
  const msgEndRef = useRef(null)
  const isAdmin = user?.email === 'princechouhan4606@gmail.com'

  // ── Load data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [lb, me] = await Promise.all([socialAPI.leaderboard(), socialAPI.getMe()])
      setLeaderboard(lb.leaderboard)
      setProfile(me.profile)
      setFollowList(new Set(me.profile?.following?.map(f => f._id)))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  const loadForum = useCallback(async () => {
    try {
      const r = await socialAPI.getForumMessages()
      setForumMsgs(r.messages)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => {
    if (tab === 'forum') {
      loadForum()
      const t = setInterval(loadForum, 10000) // poll every 10s
      return () => clearInterval(t)
    }
  }, [tab, loadForum])

  useEffect(() => {
    if (tab === 'forum') msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [forumMsgs, tab])

  // ── Profile update ────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const startEdit = () => {
    setEditForm({ bio: profile?.bio || '', country: profile?.country || '', avatar: profile?.avatar || '', isPublic: profile?.isPublic || false })
    setEditing(true)
  }

  const saveProfile = async () => {
    try {
      const r = await socialAPI.updateMe(editForm)
      setProfile(r.profile)
      setEditing(false)
    } catch (e) { alert(e.message) }
  }

  // ── Follow / Unfollow ─────────────────────────────────────────────────────
  const toggleFollow = async (userId) => {
    try {
      if (followList.has(userId)) {
        await socialAPI.unfollow(userId)
        setFollowList(prev => { const s = new Set(prev); s.delete(userId); return s })
      } else {
        await socialAPI.follow(userId)
        setFollowList(prev => new Set(prev).add(userId))
      }
    } catch (e) { alert(e.message) }
  }

  // ── Forum send ────────────────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      const r = await socialAPI.postForumMessage(msgText.trim())
      setForumMsgs(prev => [...prev, r.message])
      setMsgText('')
    } catch (e) { alert(e.message) } finally { setSending(false) }
  }

  // ── View user profile modal ───────────────────────────────────────────────
  const openProfile = async (userId) => {
    try {
      const r = await socialAPI.getProfile(userId)
      setViewProfile(r.profile)
    } catch (e) {
      if (e.message.includes('private')) setViewProfile({ _private: true })
      else alert(e.message)
    }
  }

  const TABS = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: '#ffd700' },
    { id: 'forum',       label: 'Community',   icon: MessageCircle, color: 'var(--cyan)' },
    { id: 'profile',     label: 'My Profile',  icon: Users, color: '#a78bfa' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Crown, color: '#ff4500' }] : []),
  ]

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Loader2 size={28} color="var(--cyan)" style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading Social...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .social-tab { transition: all 0.15s; }
        .social-tab:hover { background: rgba(255,255,255,0.06) !important; }
        .forum-msg { animation: fadeIn 0.4s ease; }
        .social-input { outline: none !important; }
        .social-input:focus { border-color: var(--cyan) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.2em' }}>MINDFORM</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', margin: '2px 0 16px' }}>Social Hub</h1>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className="social-tab"
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 16px', borderRadius: '10px 10px 0 0', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tab === t.id ? 'var(--bg-card)' : 'none',
                color: tab === t.id ? t.color : 'var(--text-muted)',
                borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 28px' }}>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* LEADERBOARD */}
        {/* ──────────────────────────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>🏆 Streak Leaderboard</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Top {leaderboard.length} public profiles · ranked by streak days</div>
              </div>
              <button onClick={loadAll} style={{ ...BTN('ghost'), padding: '6px 14px', fontSize: 12 }}>Refresh</button>
            </div>

            {leaderboard.length === 0 ? (
              <div style={{ ...CARD, textAlign: 'center', padding: 40 }}>
                <Globe size={36} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No public profiles yet.</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Go to "My Profile" → make your profile public to appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaderboard.map((entry, i) => (
                  <MiniProfile
                    key={entry.userId}
                    user={{ _id: entry.userId, name: entry.name, country: entry.country, avatar: entry.avatar, badges: entry.badges }}
                    streakDays={entry.streakDays}
                    aura={entry.aura}
                    rank={i}
                    isFollowing={followList.has(entry.userId)}
                    onFollow={entry.userId !== profile?._id ? () => toggleFollow(entry.userId) : null}
                    onClick={() => openProfile(entry.userId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* COMMUNITY FORUM */}
        {/* ──────────────────────────────────────────────────────────── */}
        {tab === 'forum' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>💬 Community Forum</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Messages auto-delete after 2 days · keep it clean & supportive
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {forumMsgs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  <MessageCircle size={28} color="var(--text-muted)" />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>No messages yet. Be the first to say something!</div>
                </div>
              ) : (
                forumMsgs.map((msg, i) => {
                  const isMe = msg.user?._id === profile?._id
                  return (
                    <div key={msg._id || i} className="forum-msg" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--bg-glass)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}>
                        {msg.user?.avatar || msg.user?.name?.[0] || '?'}
                      </div>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: isMe ? 'var(--cyan)' : 'var(--text-primary)' }}>
                            {msg.user?.name}
                          </span>
                          {msg.user?.country && <span style={{ fontSize: 12 }}>{flag(msg.user.country)}</span>}
                          {msg.user?.badges?.slice(0, 1).map(b => <BadgePill key={b.id} badge={b} />)}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={async () => { await adminAPI.deleteForumMsg(msg._id); loadForum() }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--red)', opacity: 0.5 }}
                              title="Delete message"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <div style={{
                          padding: '10px 14px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          background: isMe ? 'rgba(0,229,255,0.1)' : 'var(--bg-glass)',
                          border: `1px solid ${isMe ? 'rgba(0,229,255,0.2)' : 'var(--border)'}`,
                          fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
                        }}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexShrink: 0 }}>
              <input
                className="social-input"
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                placeholder="Share encouragement, tips, or ask for support..."
                maxLength={1000}
                style={{
                  flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              />
              <button onClick={sendMsg} disabled={sending || !msgText.trim()} style={{
                ...BTN('primary'), padding: '0 20px', opacity: msgText.trim() ? 1 : 0.5
              }}>
                {sending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MY PROFILE */}
        {/* ──────────────────────────────────────────────────────────── */}
        {tab === 'profile' && profile && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Profile Card */}
            <div style={{ ...CARD, marginBottom: 20 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, border: '2px solid var(--border)', flexShrink: 0,
                }}>
                  {profile.avatar || profile.name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 20, fontWeight: 900 }}>{profile.name}</div>
                    {profile.country && <span style={{ fontSize: 20 }}>{flag(profile.country)}</span>}
                    {profile.isAdmin && <span style={{ fontSize: 10, background: '#ff450020', border: '1px solid #ff450055', color: '#ff4500', padding: '2px 8px', borderRadius: 20, fontWeight: 900 }}>ADMIN</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{profile.email}</div>
                  {profile.bio && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>{profile.bio}</div>}
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cyan)' }}>{profile.followers?.length || 0}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>FOLLOWERS</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cyan)' }}>{profile.following?.length || 0}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>FOLLOWING</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: profile.isPublic ? 'var(--green)' : 'var(--text-muted)' }}>
                        {profile.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>{profile.isPublic ? 'PUBLIC' : 'PRIVATE'}</div>
                    </div>
                  </div>
                </div>
                {!editing && (
                  <button onClick={startEdit} style={{ ...BTN('ghost'), padding: '7px 14px', flexShrink: 0 }}>
                    <Settings2 size={14} /> Edit
                  </button>
                )}
              </div>

              {/* Badges */}
              {profile.badges?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 8 }}>BADGES</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
                  </div>
                </div>
              )}

              {/* Edit form */}
              {editing && (
                <div style={{ marginTop: 16, padding: '16px', background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: 'var(--cyan)' }}>Edit Profile</div>

                  {/* Avatar */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>AVATAR EMOJI</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['😎', '💪', '🦁', '👑', '🔱', '⚡', '🚀', '🧠', '🔥', '🌟', '😤', '🦊', '🐉', '🃏', '🌌'].map(e => (
                        <button key={e} onClick={() => setEditForm(f => ({ ...f, avatar: e }))}
                          style={{ fontSize: 20, padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                            border: editForm.avatar === e ? '2px solid var(--cyan)' : '2px solid var(--border)',
                            background: editForm.avatar === e ? 'rgba(0,229,255,0.1)' : 'none' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>COUNTRY</label>
                    <select
                      value={editForm.country}
                      onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bio */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>BIO ({editForm.bio?.length || 0}/200)</label>
                    <textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 200) }))}
                      placeholder="Write a short bio..."
                      rows={3}
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', resize: 'none', fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Public toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 10, marginBottom: 14, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Public Profile</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Appear on leaderboard and be discoverable by others</div>
                    </div>
                    <button
                      onClick={() => setEditForm(f => ({ ...f, isPublic: !f.isPublic }))}
                      style={{
                        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                        background: editForm.isPublic ? 'var(--green)' : 'var(--border)',
                        position: 'relative', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, transition: 'all 0.2s',
                        left: editForm.isPublic ? 25 : 3,
                      }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveProfile} style={BTN('primary')}><Check size={14} /> Save</button>
                    <button onClick={() => setEditing(false)} style={BTN('ghost')}><X size={14} /> Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Following list */}
            {profile.following?.length > 0 && (
              <div style={{ ...CARD, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
                  <Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Following
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.following.map(u => (
                    <div key={u._id} onClick={() => openProfile(u._id)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 18 }}>{u.avatar || u.name?.[0]}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{u.name}</div>
                        {u.country && <div style={{ fontSize: 11 }}>{flag(u.country)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* ADMIN PANEL */}
        {/* ──────────────────────────────────────────────────────────── */}
        {tab === 'admin' && isAdmin && <AdminPanel />}
      </div>

      {/* Profile Modal */}
      {viewProfile && (
        <ProfileModal
          profile={viewProfile}
          onClose={() => setViewProfile(null)}
          myId={profile?._id}
          isFollowing={followList.has(viewProfile._id)}
          onFollow={() => toggleFollow(viewProfile._id)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}

// ── Profile Modal ──────────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, myId, isFollowing, onFollow, isAdmin }) {
  if (profile._private) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ ...CARD, maxWidth: 360, textAlign: 'center', padding: 40 }} onClick={e => e.stopPropagation()}>
        <Lock size={32} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Private Profile</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This user has set their profile to private.</div>
        <button onClick={onClose} style={{ ...BTN('ghost'), marginTop: 20 }}>Close</button>
      </div>
    </div>
  )

  const isMe = profile._id === myId

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ ...CARD, maxWidth: 480, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid var(--border)', flexShrink: 0 }}>
            {profile.avatar || profile.name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{profile.name}</div>
              {profile.country && <span style={{ fontSize: 18 }}>{flag(profile.country)}</span>}
            </div>
            {profile.bio && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</div>}
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div><span style={{ fontSize: 16, fontWeight: 900, color: '#ff4500' }}>🔥</span> <span style={{ fontSize: 13, fontWeight: 700 }}>{profile.streakDays}d</span></div>
              <div><span style={{ fontSize: 16 }}>⚡</span> <span style={{ fontSize: 13, fontWeight: 700, color: '#ffd700' }}>{profile.aura?.toLocaleString()}</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.followers?.length || 0} followers</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
        </div>

        {profile.badges?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
          </div>
        )}

        {!isMe && (
          <button onClick={onFollow} style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), width: '100%', justifyContent: 'center', padding: 12 }}>
            {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
function AdminPanel() {
  const [users, setUsers] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([adminAPI.getUsers(), adminAPI.getBadges()])
      .then(([u, b]) => { setUsers(u.users); setBadges(b.badges) })
      .finally(() => setLoading(false))
  }, [])

  const assignBadge = async (userId, badgeId) => {
    await adminAPI.assignBadge(userId, badgeId)
    const updated = await adminAPI.getUsers()
    setUsers(updated.users)
  }

  const revokeBadge = async (userId, badgeId) => {
    await adminAPI.revokeBadge(userId, badgeId)
    const updated = await adminAPI.getUsers()
    setUsers(updated.users)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading admin panel...</div>

  return (
    <div>
      <div style={{ ...CARD, marginBottom: 20, background: 'linear-gradient(135deg, rgba(255,69,0,0.05), var(--bg-card))', border: '1px solid rgba(255,69,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Crown size={18} color="#ff4500" />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#ff4500' }}>Admin Panel</span>
          <span style={{ fontSize: 10, background: 'rgba(255,69,0,0.15)', color: '#ff4500', padding: '2px 8px', borderRadius: 20, fontWeight: 900, border: '1px solid rgba(255,69,0,0.3)' }}>PRINCE CHOUHAN</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{users.length} registered users · Assign and revoke badges</div>
      </div>

      {/* Badge catalog */}
      <div style={{ ...CARD, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Badge Catalog</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map(b => <BadgePill key={b.id} badge={b} />)}
        </div>
      </div>

      {/* User search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users by name or email..."
        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, boxSizing: 'border-box', fontFamily: 'var(--font-display)', outline: 'none' }}
      />

      {/* User list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(u => (
          <div key={u._id} style={{ ...CARD, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid var(--border)', flexShrink: 0 }}>
                {u.avatar || u.name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{u.name}</span>
                  {u.country && <span>{flag(u.country)}</span>}
                  {u.isPublic ? <Globe size={12} color="var(--green)" /> : <Lock size={12} color="var(--text-muted)" />}
                  {u.isAdmin && <span style={{ fontSize: 9, background: 'rgba(255,69,0,0.15)', color: '#ff4500', padding: '1px 6px', borderRadius: 20, fontWeight: 900, border: '1px solid rgba(255,69,0,0.3)' }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{u.email}</div>
              </div>
              <button
                onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                style={{ ...BTN('ghost'), padding: '5px 12px', fontSize: 11 }}>
                {selectedUser?._id === u._id ? 'Close' : 'Manage Badges'}
              </button>
            </div>

            {/* Current badges */}
            {u.badges?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingLeft: 48 }}>
                {u.badges.map(b => (
                  <div key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <BadgePill badge={b} />
                    <button
                      onClick={() => revokeBadge(u._id, b.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2, opacity: 0.7 }}
                      title="Revoke">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Badge assignment */}
            {selectedUser?._id === u._id && (
              <div style={{ marginTop: 12, paddingLeft: 48, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.1em' }}>ASSIGN BADGE</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {badges.filter(b => !u.badges?.some(ub => ub.id === b.id)).map(b => (
                    <button
                      key={b.id}
                      onClick={() => assignBadge(u._id, b.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: `${b.color}15`, border: `1px solid ${b.color}44`, color: b.color, transition: 'all 0.15s' }}
                    >
                      {b.emoji} + {b.label}
                    </button>
                  ))}
                  {badges.every(b => u.badges?.some(ub => ub.id === b.id)) && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>All badges assigned ✅</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
