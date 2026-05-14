import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy, Users, MessageCircle, Globe, Lock, Eye, EyeOff, Send,
  UserCheck, UserPlus, Star, Shield, Crown, Zap, ChevronRight,
  Settings2, Trash2, Check, X, Loader2
} from 'lucide-react'
import { socialAPI, adminAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

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

const BTN = (variant = 'primary') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
  ...(variant === 'primary' ? {
    background: 'var(--brand-primary)', color: '#000',
  } : variant === 'danger' ? {
    background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)',
  } : {
    background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
  }),
})

function BadgePill({ badge }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 800,
      background: `${badge.color}20`, border: `1px solid ${badge.color}55`, color: badge.color,
    }}>
      {badge.emoji} {badge.label}
    </span>
  )
}

function MiniProfile({ user, streakDays = 0, aura = 0, rank, onClick, isFollowing, onFollow }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
    }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
       onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      {rank !== undefined && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: rank === 0 ? '#FFD70030' : rank === 1 ? '#C0C0C030' : rank === 2 ? '#CD7F3230' : 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900,
          color: rank === 0 ? '#FFD700' : rank === 1 ? '#C0C0C0' : rank === 2 ? '#CD7F32' : 'var(--text-muted)',
        }}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
        </div>
      )}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
      }}>
        {user.avatar || user.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <button onClick={e => { e.stopPropagation(); onFollow() }} style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), padding: '6px 12px', fontSize: 12 }}>
            {isFollowing ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
          </button>
        )}
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  )
}

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
    } catch (e) { alert(e.message) }
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
    } catch (e) { alert(e.message) }
  }

  const sendMsg = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      const r = await socialAPI.postForumMessage(msgText.trim())
      setForumMsgs(prev => [...prev, r.message])
      setMsgText('')
    } catch (e) { alert(e.message) } finally { setSending(false) }
  }

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
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: '#ffd700', desc: 'Top streaks globally' },
    { id: 'forum',       label: 'Community',   icon: MessageCircle, color: 'var(--brand-primary)', desc: 'Join the conversation' },
    { id: 'profile',     label: 'My Profile',  icon: Users, color: '#a78bfa', desc: 'Manage your public persona' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Crown, color: '#ff4500', desc: 'Site administration' }] : []),
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

  const renderContent = () => {
    if (tab === 'leaderboard') return (
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>🏆 Global Leaderboard</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Top {leaderboard.length} public profiles ranked by streak</div>
          </div>
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ background: 'var(--bg-surface)', padding: 40, borderRadius: 16, textAlign: 'center', border: '1px solid var(--border)' }}>
            <Globe size={36} color="var(--text-muted)" style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No public profiles yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    )

    if (tab === 'forum') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>💬 Community Forum</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Connect, support, and share tips (messages auto-delete after 2 days).</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {forumMsgs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <MessageCircle size={32} color="var(--text-muted)" />
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>No messages yet. Say hello!</div>
            </div>
          ) : (
            forumMsgs.map((msg, i) => {
              const isMe = msg.user?._id === profile?._id
              return (
                <div key={msg._id || i} style={{ display: 'flex', gap: 12, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {msg.user?.avatar || msg.user?.name?.[0] || '?'}
                  </div>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{msg.user?.name}</span>
                      {msg.user?.country && <span style={{ fontSize: 12 }}>{flag(msg.user.country)}</span>}
                      {msg.user?.badges?.slice(0, 1).map(b => <BadgePill key={b.id} badge={b} />)}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAdmin && (
                        <button onClick={async () => { await adminAPI.deleteForumMsg(msg._id); loadForum() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', opacity: 0.5 }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '12px 16px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isMe ? 'var(--brand-primary-dim)' : 'var(--bg-glass)', border: `1px solid ${isMe ? 'var(--brand-primary-glow)' : 'var(--border)'}`, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={msgEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexShrink: 0 }}>
          <input
            value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Share encouragement or ask for support..." maxLength={1000}
            style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', outline: 'none' }}
          />
          <button onClick={sendMsg} disabled={sending || !msgText.trim()} style={{ ...BTN('primary'), padding: '0 24px', opacity: msgText.trim() ? 1 : 0.5, borderRadius: 12 }}>
            {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    )

    if (tab === 'profile' && profile) return (
      <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: 80, background: 'linear-gradient(135deg, var(--brand-primary-dim), var(--bg-card))', borderBottom: '1px solid var(--border)' }} />
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '4px solid var(--bg-surface)', marginTop: -40 }}>
                {profile.avatar || profile.name?.[0]}
              </div>
              <div style={{ marginTop: 16 }}>
                {!editing && <button onClick={startEdit} style={{ ...BTN('ghost'), padding: '8px 16px' }}><Settings2 size={14} /> Edit Profile</button>}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900 }}>{profile.name}</h2>
                {profile.country && <span style={{ fontSize: 22 }}>{flag(profile.country)}</span>}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{profile.email}</div>
              {profile.bio && <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, maxWidth: '90%' }}>{profile.bio}</div>}
              <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                <div><span style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand-primary)' }}>{profile.followers?.length || 0}</span> <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>FOLLOWERS</span></div>
                <div><span style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand-primary)' }}>{profile.following?.length || 0}</span> <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>FOLLOWING</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: profile.isPublic ? 'var(--green)' : 'var(--text-muted)' }}>
                  {profile.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>{profile.isPublic ? 'PUBLIC' : 'PRIVATE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div style={{ padding: '24px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--brand-primary-glow)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: 'var(--brand-primary)' }}>Edit Profile</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>AVATAR EMOJI</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['😎', '💪', '🦁', '👑', '🔱', '⚡', '🚀', '🧠', '🔥', '🌟', '🦊', '🐉', '🌌'].map(e => (
                  <button key={e} onClick={() => setEditForm(f => ({ ...f, avatar: e }))} style={{ fontSize: 24, padding: '8px', borderRadius: 12, cursor: 'pointer', border: editForm.avatar === e ? '2px solid var(--brand-primary)' : '2px solid var(--border)', background: editForm.avatar === e ? 'var(--brand-primary-dim)' : 'var(--bg-glass)' }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>COUNTRY</label>
              <select value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: 'var(--text-primary)', outline: 'none' }}>
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>BIO ({editForm.bio?.length || 0}/200)</label>
              <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 200) }))} rows={3} style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: 'var(--text-primary)', resize: 'none', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-glass)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Public Profile</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Appear on leaderboard and be discoverable by others</div>
              </div>
              <button onClick={() => setEditForm(f => ({ ...f, isPublic: !f.isPublic }))} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: editForm.isPublic ? 'var(--green)' : 'var(--border)', position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'all 0.2s', left: editForm.isPublic ? 27 : 3 }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={saveProfile} style={BTN('primary')}><Check size={15} /> Save Changes</button>
              <button onClick={() => setEditing(false)} style={BTN('ghost')}><X size={15} /> Cancel</button>
            </div>
          </div>
        )}

        {profile.badges?.length > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 12 }}>ACHIEVED BADGES</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
            </div>
          </div>
        )}

        {profile.following?.length > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} /> FOLLOWING</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {profile.following.map(u => (
                <div key={u._id} onClick={() => openProfile(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ fontSize: 20 }}>{u.avatar || u.name?.[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name}</div>
                    {u.country && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{flag(u.country)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )

    if (tab === 'admin' && isAdmin) return <AdminPanel />
    return null
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      
      {/* Navigation */}
      {isMobile ? (
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, fontFamily: 'var(--font-display)' }}>Social Hub</h1>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {TABS.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer', background: tab === id ? color + '18' : 'var(--bg-glass)', border: `1px solid ${tab === id ? color : 'var(--border)'}`, color: tab === id ? color : 'var(--text-muted)', transition: 'all 0.15s' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 12px', background: 'var(--bg-surface)', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.14em', padding: '0 12px', marginBottom: 12 }}>SOCIAL</div>
          {TABS.map(({ id, label, icon: Icon, color, desc }) => {
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: active ? color + '12' : 'transparent', border: `1px solid ${active ? color + '40' : 'transparent'}`, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.2s', textAlign: 'left', width: '100%' }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-glass)' }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: active ? color + '20' : 'var(--bg-glass)', border: `1px solid ${active ? color + '40' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Icon size={15} color={active ? color : 'var(--text-muted)'} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
                </div>
              </button>
            )
          })}
        </aside>
      )}

      {/* Main View */}
      <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '20px 16px 80px' : '32px 40px', animation: 'fadeIn 0.2s ease' }}>
        {renderContent()}
      </main>

      {viewProfile && <ProfileModal profile={viewProfile} onClose={() => setViewProfile(null)} myId={profile?._id} isFollowing={followList.has(viewProfile._id)} onFollow={() => toggleFollow(viewProfile._id)} />}
    </div>
  )
}

function ProfileModal({ profile, onClose, myId, isFollowing, onFollow }) {
  if (profile._private) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px', maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <Lock size={36} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Private Profile</h3>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>This user has set their profile to private.</div>
        <button onClick={onClose} style={{ ...BTN('ghost'), marginTop: 24, width: '100%', justifyContent: 'center' }}>Close</button>
      </div>
    </div>
  )

  const isMe = profile._id === myId
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', maxWidth: 480, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '2px solid var(--border)', flexShrink: 0 }}>
            {profile.avatar || profile.name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 22, fontWeight: 900 }}>{profile.name}</h3>
              {profile.country && <span style={{ fontSize: 20 }}>{flag(profile.country)}</span>}
            </div>
            {profile.bio && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{profile.bio}</div>}
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <div><span style={{ fontSize: 18, fontWeight: 900, color: '#ff4500' }}>🔥</span> <span style={{ fontSize: 14, fontWeight: 700 }}>{profile.streakDays}d</span></div>
              <div><span style={{ fontSize: 18 }}>⚡</span> <span style={{ fontSize: 14, fontWeight: 700, color: '#ffd700' }}>{profile.aura?.toLocaleString()}</span></div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}><strong>{profile.followers?.length || 0}</strong> followers</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        {profile.badges?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {profile.badges.map(b => <BadgePill key={b.id} badge={b} />)}
          </div>
        )}
        {!isMe && (
          <button onClick={onFollow} style={{ ...BTN(isFollowing ? 'ghost' : 'primary'), width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
            {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
          </button>
        )}
      </div>
    </div>
  )
}

function AdminPanel() {
  const [users, setUsers] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    Promise.all([adminAPI.getUsers(), adminAPI.getBadges()]).then(([u, b]) => { setUsers(u.users); setBadges(b.badges) }).finally(() => setLoading(false))
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

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading admin panel...</div>

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u._id.includes(search))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(255,69,0,0.05), var(--bg-surface))', border: '1px solid rgba(255,69,0,0.3)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Crown size={20} color="#ff4500" />
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#ff4500' }}>Admin Panel</h2>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{users.length} registered users</div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Badge Catalog</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map(b => <BadgePill key={b.id} badge={b} />)}
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name, email, or ID..." style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: 'var(--text-primary)', marginBottom: 20, outline: 'none' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(u => (
          <div key={u._id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid var(--border)' }}>{u.avatar || u.name?.[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{u.name}</span>
                  {u.country && <span>{flag(u.country)}</span>}
                  {u.isPublic ? <Globe size={12} color="var(--green)" /> : <Lock size={12} color="var(--text-muted)" />}
                  {u.isAdmin && <span style={{ fontSize: 9, background: 'rgba(255,69,0,0.15)', color: '#ff4500', padding: '1px 6px', borderRadius: 20, fontWeight: 900, border: '1px solid rgba(255,69,0,0.3)' }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{u.email}</span>
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>ID: {u._id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)} style={{ ...BTN('ghost'), padding: '6px 14px', fontSize: 12 }}>
                {selectedUser?._id === u._id ? 'Close' : 'Manage Badges'}
              </button>
            </div>

            {u.badges?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingLeft: 58 }}>
                {u.badges.map(b => (
                  <div key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <BadgePill badge={b} />
                    <button onClick={() => revokeBadge(u._id, b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2, opacity: 0.7 }} title="Revoke">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedUser?._id === u._id && (
              <div style={{ marginTop: 16, paddingLeft: 58, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, marginBottom: 12, letterSpacing: '0.1em' }}>ASSIGN BADGE</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {badges.filter(b => !u.badges?.some(ub => ub.id === b.id)).map(b => (
                    <button key={b.id} onClick={() => assignBadge(u._id, b.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: `${b.color}15`, border: `1px solid ${b.color}44`, color: b.color, transition: 'all 0.15s' }}>
                      {b.emoji} + {b.label}
                    </button>
                  ))}
                  {badges.every(b => u.badges?.some(ub => ub.id === b.id)) && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>All badges assigned ✅</span>
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
