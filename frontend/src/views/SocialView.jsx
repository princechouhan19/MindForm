import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy, Users, MessageCircle, Globe, Lock, Eye, EyeOff, Send,
  UserCheck, UserPlus, Crown, ChevronRight,
  Settings2, Trash2, Check, X, Loader2, Flame, Zap, Share2
} from 'lucide-react'
import { socialAPI, adminAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

/* ═══════════════════════════════════════════════════════════════
   Social — Apple design language (v2.1)
   • Game Center-style podium leaderboard
   • iMessage-style community chat
   • iOS inset-grouped profile & settings rows
   • 44-pt touch targets, segmented controls
═══════════════════════════════════════════════════════════════ */

const flag = (code) => {
  if (!code || code.length !== 2) return '🌍'
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}

const COUNTRIES = [
  { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' }
]

const AVATARS = ['😎', '💪', '🦁', '👑', '🔱', '⚡', '🚀', '🧠', '🔥', '🌟', '🦊', '🐉', '🌌']

// iOS-style filled button
const BTN = (variant = 'primary') => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 'var(--radius-pill)', fontSize: 13.5, fontWeight: 600,
  cursor: 'pointer', border: 'none', transition: 'all 0.15s', minHeight: 38,
  ...(variant === 'primary' ? {
    background: 'var(--brand-primary)', color: '#fff',
  } : variant === 'danger' ? {
    background: 'var(--red-dim)', border: '1px solid color-mix(in srgb, var(--brand-error) 45%, transparent)', color: 'var(--brand-error)',
  } : {
    background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-primary)',
  }),
})

function BadgePill({ badge }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: `${badge.color}20`, border: `1px solid ${badge.color}55`, color: badge.color,
    }}>
      {badge.emoji} {badge.label}
    </span>
  )
}

function Avatar({ user, size = 42, border = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-elevated)', border: border ? '2px solid var(--border-bright)' : '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.46,
    }}>
      {user?.avatar || user?.name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

/* ── Game Center-style podium (top 3) ───────────────────────── */
function Podium({ entries, onOpen, followList, onFollow, myId }) {
  const order = [entries[1], entries[0], entries[2]] // 2nd, 1st, 3rd
  const heights = { 1: 150, 0: 118, 2: 104 } // by original rank index
  const medal = { 0: '🥇', 1: '🥈', 2: '🥉' }
  const glow = { 0: 'color-mix(in srgb, var(--brand-warning) 30%, transparent)', 1: 'rgba(255,255,255,0.14)', 2: 'color-mix(in srgb, var(--brand-orange) 26%, transparent)' }

  if (entries.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 24, paddingTop: 8 }}>
      {order.map((e, pos) => {
        if (!e) return <div key={pos} style={{ flex: 1, maxWidth: 150 }} />
        const rank = entries.indexOf(e)
        const isMe = e.userId === myId
        return (
          <div key={e.userId} style={{ flex: 1, maxWidth: 170, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => onOpen(e.userId)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Avatar user={{ name: e.name, avatar: e.avatar }} size={rank === 0 ? 64 : 52} border />
                <span style={{ position: 'absolute', bottom: -4, right: -6, fontSize: 18 }}>{medal[rank]}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.name}{e.country ? ` ${flag(e.country)}` : ''}
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, color: rank === 0 ? 'var(--brand-warning)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginTop: 2 }}>
                {e.streakDays}<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>d</span>
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--brand-warning)', fontWeight: 600 }}>⚡ {e.aura?.toLocaleString?.() ?? e.aura}</span>
            </button>
            <div style={{
              width: '100%', height: heights[rank], marginTop: 10,
              borderRadius: '14px 14px 0 0',
              background: `color-mix(in srgb, ${glow[rank]} 12%, transparent)`,
              border: '1px solid var(--border)', borderBottom: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: rank === 0 ? 26 : 20, fontWeight: 600, color: 'var(--text-muted)',
            }}>
              {rank + 1}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Leaderboard row (rank 4+) ──────────────────────────────── */
function LeaderRow({ entry, rank, onClick, isFollowing, onFollow, isMe }) {
  return (
    <div onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        cursor: 'pointer', transition: 'background 0.15s',
        borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ width: 26, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        {rank + 1}
      </span>
      <Avatar user={{ name: entry.name, avatar: entry.avatar }} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
          {entry.country && <span style={{ fontSize: 12 }}>{flag(entry.country)}</span>}
          {isMe && <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--brand-primary)', background: 'var(--brand-primary-dim)', padding: '2px 8px', borderRadius: 20 }}>YOU</span>}
          {entry.badges?.slice(0, 2).map(b => <BadgePill key={b.id} badge={b} />)}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--brand-error)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Flame size={12} /> {entry.streakDays}d
          </span>
          <span style={{ fontSize: 12, color: 'var(--brand-warning)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Zap size={12} /> {entry.aura?.toLocaleString?.() ?? entry.aura}
          </span>
        </div>
      </div>
      {onFollow && !isMe ? (
        <button onClick={e => { e.stopPropagation(); onFollow() }} style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), padding: '6px 14px', fontSize: 12.5, minHeight: 34 }}>
          {isFollowing ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
        </button>
      ) : null}
      <ChevronRight size={15} color="var(--text-muted)" />
    </div>
  )
}

/* ── iOS inset-grouped card ─────────────────────────────────── */
function InsetGroup({ title, children, footer }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 14px 8px' }}>{title}</div>}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {children}
      </div>
      {footer && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 14px 0', lineHeight: 1.45 }}>{footer}</div>}
    </div>
  )
}

/* ── iOS-style toggle ───────────────────────────────────────── */
export function IOSToggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      style={{
        width: 51, height: 31, borderRadius: 16, border: 'none', cursor: 'pointer',
        background: on ? 'var(--brand-success)' : 'var(--border-bright)',
        position: 'relative', transition: 'background 0.2s var(--ease-apple)', flexShrink: 0, padding: 0,
      }}>
      <div style={{
        width: 27, height: 27, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 22 : 2,
        transition: 'left 0.2s var(--ease-spring)',
        
      }} />
    </button>
  )
}

export default function SocialView() {
  const toast = useToast()
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
      const t = setInterval(loadForum, 10000)
      return () => clearInterval(t)
    }
  }, [tab, loadForum])

  useEffect(() => {
    if (tab === 'forum') msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [forumMsgs, tab])

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
      toast.success('Profile updated.')
    } catch (e) { toast.error(e.message || 'Could not save profile.') }
  }

  const toggleFollow = async (userId) => {
    try {
      if (followList.has(userId)) {
        await socialAPI.unfollow(userId)
        setFollowList(prev => { const s = new Set(prev); s.delete(userId); return s })
      } else {
        await socialAPI.follow(userId)
        setFollowList(prev => new Set(prev).add(userId))
      }
    } catch (e) { toast.error(e.message || 'Follow action failed.') }
  }

  const sendMsg = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      const r = await socialAPI.postForumMessage(msgText.trim())
      setForumMsgs(prev => [...prev, r.message])
      setMsgText('')
    } catch (e) { toast.error(e.message || 'Could not send message.') } finally { setSending(false) }
  }

  const openProfile = async (userId) => {
    try {
      const r = await socialAPI.getProfile(userId)
      setViewProfile(r.profile)
    } catch (e) {
      if (e.message.includes('private')) setViewProfile({ _private: true })
      else toast.error(e.message || 'Could not open profile.')
    }
  }

  const TABS = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'forum',       label: 'Community',   icon: MessageCircle },
    { id: 'profile',     label: 'My Profile',  icon: Users },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Crown }] : []),
  ]

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Loader2 size={28} color="var(--brand-primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading Hub...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  /* ── Leaderboard content ── */
  const leaderboardContent = (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={19} color="var(--brand-warning)" /> Global Leaderboard
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Top {leaderboard.length} public profiles ranked by clean streak</div>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', padding: 48, borderRadius: 'var(--radius-xl)', textAlign: 'center', border: '1px solid var(--border)', marginTop: 20 }}>
          <Globe size={36} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No public profiles yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Make your profile public to appear here.</div>
        </div>
      ) : (
        <>
          <Podium entries={leaderboard.slice(0, 3)} onOpen={openProfile} followList={followList} onFollow={toggleFollow} myId={profile?._id} />
          {leaderboard.length > 3 && (
            <InsetGroup title="Rankings">
              {leaderboard.slice(3).map((entry, i) => (
                <LeaderRow
                  key={entry.userId}
                  entry={entry}
                  rank={i + 3}
                  onClick={() => openProfile(entry.userId)}
                  isFollowing={followList.has(entry.userId)}
                  onFollow={() => toggleFollow(entry.userId)}
                  isMe={entry.userId === profile?._id}
                />
              ))}
            </InsetGroup>
          )}
        </>
      )}
    </div>
  )

  /* ── Forum content (iMessage style) ── */
  const forumContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={19} color="var(--brand-primary)" /> Community
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Support, share, and stay accountable. Messages auto-delete after 2 days.</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {forumMsgs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
            <MessageCircle size={32} color="var(--text-muted)" />
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>No messages yet. Say hello 👋</div>
          </div>
        ) : (
          forumMsgs.map((msg, i) => {
            const isMe = msg.user?._id === profile?._id
            const prev = forumMsgs[i - 1]
            const showHeader = !prev || prev.user?._id !== msg.user?._id ||
              (new Date(msg.createdAt) - new Date(prev.createdAt)) > 5 * 60 * 1000
            return (
              <div key={msg._id || i} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row', marginTop: showHeader ? 12 : 2 }}>
                <div style={{ width: 30, flexShrink: 0, visibility: showHeader ? 'visible' : 'hidden' }}>
                  {showHeader && <Avatar user={msg.user} size={30} />}
                </div>
                <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {showHeader && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexDirection: isMe ? 'row-reverse' : 'row', padding: '0 4px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{msg.user?.name}</span>
                      {msg.user?.country && <span style={{ fontSize: 11 }}>{flag(msg.user.country)}</span>}
                      {msg.user?.badges?.slice(0, 1).map(b => <BadgePill key={b.id} badge={b} />)}
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAdmin && (
                        <button onClick={async () => { await adminAPI.deleteForumMsg(msg._id); loadForum() }}
                          aria-label="Delete message"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-error)', opacity: 0.5, display: 'flex', padding: 2 }}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 5 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 5,
                    background: isMe ? 'var(--brand-primary)' : 'var(--bg-glass)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    fontSize: 14.5, lineHeight: 1.45,
                    color: isMe ? '#ffffff' : 'var(--text-primary)',
                    overflowWrap: 'anywhere',
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
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexShrink: 0, paddingBottom: 2 }}>
        <input
          value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="Share encouragement or ask for support..." maxLength={1000}
          style={{ flex: 1, minWidth: 0, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', padding: '12px 18px', fontSize: 14.5, color: 'var(--text-primary)', outline: 'none' }}
        />
        <button onClick={sendMsg} disabled={sending || !msgText.trim()} aria-label="Send message"
          style={{ width: 44, height: 44, borderRadius: '50%', background: msgText.trim() ? 'var(--brand-primary)' : 'var(--bg-glass)', color: msgText.trim() ? '#fff' : 'var(--text-muted)', border: 'none', cursor: msgText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
          {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )

  /* ── Profile content ── */
  const profileContent = profile && (
    <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      {/* Hero card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 76, background: 'var(--brand-primary-dim)' }} />
        <div style={{ padding: '0 24px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '4px solid var(--bg-card)', marginTop: -38, boxShadow: 'var(--shadow-md)' }}>
              {profile.avatar || profile.name?.[0]}
            </div>
            {!editing && (
              <button onClick={startEdit} style={{ ...BTN('ghost'), marginTop: 14 }}>
                <Settings2 size={14} /> Edit Profile
              </button>
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em' }}>{profile.name}</h2>
              {profile.country && <span style={{ fontSize: 20 }}>{flag(profile.country)}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: profile.isPublic ? 'var(--brand-success)' : 'var(--text-muted)', background: profile.isPublic ? 'var(--green-dim)' : 'var(--bg-glass)', padding: '3px 10px', borderRadius: 20 }}>
                {profile.isPublic ? <Eye size={12} /> : <EyeOff size={12} />} {profile.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{profile.email}</div>
            {profile.bio && <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.55 }}>{profile.bio}</div>}
          </div>
        </div>
        {/* Stats band */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>
          {[
            [profile.followers?.length || 0, 'Followers', 'var(--brand-primary)'],
            [profile.following?.length || 0, 'Following', 'var(--brand-primary)'],
            [profile.streakDays, 'Day Streak', 'var(--brand-error)'],
          ].map(([v, l, c], i) => (
            <div key={l} style={{ padding: '14px 10px', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: c, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <InsetGroup title="Edit profile">
          <div style={{ padding: 18 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>AVATAR</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {AVATARS.map(e => (
                <button key={e} onClick={() => setEditForm(f => ({ ...f, avatar: e }))}
                  style={{ fontSize: 22, width: 44, height: 44, borderRadius: 12, cursor: 'pointer', border: editForm.avatar === e ? '2px solid var(--brand-primary)' : '1px solid var(--border)', background: editForm.avatar === e ? 'var(--brand-primary-dim)' : 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {e}
                </button>
              ))}
            </div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>COUNTRY</label>
            <select value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
              style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--text-primary)', outline: 'none', marginBottom: 16 }}>
              <option value="">Select country...</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>)}
            </select>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>BIO ({editForm.bio?.length || 0}/200)</label>
            <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 200) }))} rows={3}
              style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--text-primary)', resize: 'none', outline: 'none', marginBottom: 16 }} />
            {/* Public toggle row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '13px 14px', background: 'var(--bg-glass)', borderRadius: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Public profile</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Appear on the leaderboard and be discoverable</div>
              </div>
              <IOSToggle on={!!editForm.isPublic} onChange={v => setEditForm(f => ({ ...f, isPublic: v }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveProfile} style={BTN('primary')}><Check size={15} /> Save Changes</button>
              <button onClick={() => setEditing(false)} style={BTN('ghost')}><X size={15} /> Cancel</button>
            </div>
          </div>
        </InsetGroup>
      )}

      {profile.badges?.length > 0 && (
        <InsetGroup title="Achieved badges">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 16 }}>
            {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
          </div>
        </InsetGroup>
      )}

      {profile.following?.length > 0 && (
        <InsetGroup title="Following">
          {profile.following.map((u, i) => (
            <div key={u._id} onClick={() => openProfile(u._id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: i < profile.following.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Avatar user={u} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                {u.country && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{flag(u.country)}</div>}
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </div>
          ))}
        </InsetGroup>
      )}
    </div>
  )

  const renderContent = () => {
    if (tab === 'leaderboard') return leaderboardContent
    if (tab === 'forum') return forumContent
    if (tab === 'profile') return profileContent
    if (tab === 'admin' && isAdmin) return <AdminPanel />
    return null
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Navigation */}
      {isMobile ? (
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em' }}>Social</h1>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer', minHeight: 38,
                  background: tab === id ? 'var(--brand-primary)' : 'var(--bg-glass)',
                  border: `1px solid ${tab === id ? 'var(--brand-primary)' : 'var(--border)'}`,
                  color: tab === id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <aside style={{ width: 232, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '28px 14px', background: 'var(--bg-surface)', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.14em', padding: '0 12px', marginBottom: 12 }}>SOCIAL</div>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                  background: active ? 'var(--brand-primary-dim)' : 'transparent',
                  border: 'none', color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.18s var(--ease-apple)', textAlign: 'left', width: '100%',
                  fontSize: 14, fontWeight: active ? 700 : 500, minHeight: 44,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-glass)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <Icon size={16} />
                {label}
              </button>
            )
          })}
          {/* Community stats mini-card */}
          <div style={{ marginTop: 'auto', padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>HUB</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ranked</span><strong style={{ color: 'var(--text-primary)' }}>{leaderboard.length}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Following</span><strong style={{ color: 'var(--text-primary)' }}>{profile?.following?.length || 0}</strong></div>
            </div>
          </div>
        </aside>
      )}

      {/* Main View */}
      <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px 14px 96px' : '28px 36px', animation: 'fadeIn 0.2s ease' }}>
        {renderContent()}
      </main>

      {viewProfile && <ProfileModal profile={viewProfile} onClose={() => setViewProfile(null)} myId={profile?._id} isFollowing={followList.has(viewProfile._id)} onFollow={() => toggleFollow(viewProfile._id)} />}
    </div>
  )
}

/* ── Profile modal ──────────────────────────────────────────── */
function ProfileModal({ profile, onClose, myId, isFollowing, onFollow }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (profile._private) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '36px 28px', maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <Lock size={34} color="var(--text-muted)" style={{ marginBottom: 14, opacity: 0.5 }} />
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Private Profile</h3>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>This user has set their profile to private.</div>
        <button onClick={onClose} style={{ ...BTN('ghost'), marginTop: 22, width: '100%' }}>Close</button>
      </div>
    </div>
  )

  const isMe = profile._id === myId
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="mf-sheet" style={{ maxWidth: 440, width: '100%', maxHeight: '82vh', overflow: 'auto', padding: '26px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <Avatar user={profile} size={64} border />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{profile.name}</h3>
              {profile.country && <span style={{ fontSize: 18 }}>{flag(profile.country)}</span>}
            </div>
            {profile.bio && <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}><X size={19} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            [`${profile.streakDays}d`, 'Streak', 'var(--brand-error)'],
            [profile.aura?.toLocaleString?.() ?? profile.aura, 'Aura', 'var(--brand-warning)'],
            [profile.followers?.length || 0, 'Followers', 'var(--brand-primary)'],
          ].map(([v, l, c]) => (
            <div key={l} style={{ background: 'var(--bg-glass)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: c, fontFamily: 'var(--font-display)' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>

        {profile.badges?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
          </div>
        )}
        {!isMe && (
          <button onClick={onFollow} style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), width: '100%', minHeight: 46, fontSize: 14.5 }}>
            {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Admin panel ────────────────────────────────────────────── */
function AdminPanel() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [users, setUsers] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    Promise.all([adminAPI.getUsers(), adminAPI.getBadges()]).then(([u, b]) => { setUsers(u.users); setBadges(b.badges) }).finally(() => setLoading(false))
  }, [])

  const assignBadge = async (userId, badgeId) => {
    if (busy) return
    setBusy(true)
    try {
      await adminAPI.assignBadge(userId, badgeId)
      const updated = await adminAPI.getUsers()
      setUsers(updated.users)
      toast.success('Badge assigned.')
    } catch (e) { toast.error(e.message || 'Could not assign badge.') } finally { setBusy(false) }
  }

  const revokeBadge = async (userId, badgeId) => {
    if (busy) return
    setBusy(true)
    try {
      await adminAPI.revokeBadge(userId, badgeId)
      const updated = await adminAPI.getUsers()
      setUsers(updated.users)
      toast.success('Badge revoked.')
    } catch (e) { toast.error(e.message || 'Could not revoke badge.') } finally { setBusy(false) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading admin panel…</div>

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u._id.includes(search))

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <InsetGroup title="Administration" footer="Assign recognition badges to members of the community.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderBottom: '1px solid var(--border)' }}>
          <Crown size={18} color="var(--brand-warning)" />
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{users.length} registered users</div>
        </div>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 10 }}>BADGE CATALOG</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {badges.map(b => <BadgePill key={b.id} badge={b} />)}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name, email, or ID..."
            style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
        </div>
      </InsetGroup>

      <InsetGroup title="Users">
        {filtered.map(u => (
          <div key={u._id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar user={u} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{u.name}</span>
                  {u.country && <span>{flag(u.country)}</span>}
                  {u.isPublic ? <Globe size={12} color="var(--brand-success)" /> : <Lock size={12} color="var(--text-muted)" />}
                  {u.isAdmin && <span style={{ fontSize: 9, background: 'color-mix(in srgb, var(--brand-warning) 14%, transparent)', color: 'var(--brand-warning)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{u.email}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{u._id.slice(-6)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)} style={{ ...BTN('ghost'), padding: '6px 14px', fontSize: 12, minHeight: 34 }}>
                {selectedUser?._id === u._id ? 'Close' : 'Badges'}
              </button>
            </div>

            {u.badges?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingLeft: 54 }}>
                {u.badges.map(b => (
                  <div key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <BadgePill badge={b} />
                    <button onClick={() => revokeBadge(u._id, b.id)} aria-label="Revoke badge" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-error)', padding: 2, opacity: 0.7 }} title="Revoke">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedUser?._id === u._id && (
              <div style={{ marginTop: 14, paddingLeft: 54, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, letterSpacing: '0.1em' }}>ASSIGN BADGE</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {badges.filter(b => !u.badges?.some(ub => ub.id === b.id)).map(b => (
                    <button key={b.id} onClick={() => assignBadge(u._id, b.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: `${b.color}15`, border: `1px solid ${b.color}44`, color: b.color, transition: 'all 0.15s', minHeight: 34 }}>
                      {b.emoji} + {b.label}
                    </button>
                  ))}
                  {badges.every(b => u.badges?.some(ub => ub.id === b.id)) && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>All badges assigned ✓</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users match “{search}”.</div>}
      </InsetGroup>
    </div>
  )
}
