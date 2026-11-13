/* ═══════════════════════════════════════════════════════════════
   AI provider catalogue for Coach — single source of truth.

   • Four first-party providers with curated model lists
   • Two built-in aggregators as EDITABLE defaults: OpenRouter and
     NVIDIA NIM (build.nvidia.com). Their catalogues hold hundreds
     of models, so the model picker is searchable and can fetch the
     live /models list (cached 12 h, graceful offline fallback).
   • Fully custom providers: any OpenAI-compatible base URL
     (Ollama, LM Studio, vLLM, Together, Groq, Azure gateways…).

   Keys never live here — they stay in CoachView's mf_ai_keys map
   (browser local storage only).
   ═══════════════════════════════════════════════════════════════ */

import React from 'react'
import { Sparkles } from 'lucide-react'

/* ── Inline SVG logos (offline, CSP-safe, no external requests) ── */
export function ProviderLogo({ id, size = 18 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 }
  if (id === 'openai') return (
    <svg viewBox="0 0 24 24" style={{ ...s, color: '#10a37f' }} fill="currentColor" aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558-5.833-3.387L15.871 7.1971a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.405-.667zm2.0107-3.0231-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654 2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
    </svg>
  )
  if (id === 'gemini') return (
    <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
      <defs>
        <linearGradient id="mf-gemini-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4285F4" /><stop offset="1" stopColor="#9B72CB" />
        </linearGradient>
      </defs>
      <path fill="url(#mf-gemini-g)" d="M12 0Q12 12 24 12Q12 12 12 24Q12 12 0 12Q12 12 12 0Z" />
    </svg>
  )
  if (id === 'anthropic') return (
    <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
      <g stroke="#D97757" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="2.4" x2="12" y2="7.8" />
        <line x1="12" y1="16.2" x2="12" y2="21.6" />
        <line x1="2.4" y1="12" x2="7.8" y2="12" />
        <line x1="16.2" y1="12" x2="21.6" y2="12" />
        <line x1="5.4" y1="5.4" x2="9" y2="9" />
        <line x1="15" y1="15" x2="18.6" y2="18.6" />
        <line x1="5.4" y1="18.6" x2="9" y2="15" />
        <line x1="15" y1="9" x2="18.6" y2="5.4" />
      </g>
    </svg>
  )
  if (id === 'mistral') {
    const rows = ['#FFD800', '#FFAF00', '#FF8205', '#FA500F', '#E10500']
    const cells = [
      [0, 0], [5, 0],
      [0, 1], [1, 1], [4, 1], [5, 1],
      [0, 2], [2, 2], [3, 2], [5, 2],
      [0, 3], [5, 3],
      [0, 4], [5, 4],
    ]
    return (
      <svg viewBox="0 0 24 20" style={{ ...s, borderRadius: 2 }} aria-hidden="true">
        {cells.map(([x, y], i) => (
          <rect key={i} x={x * 4} y={y * 4} width="4" height="4" fill={rows[y]} />
        ))}
      </svg>
    )
  }
  if (id === 'openrouter') return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" stroke="#6467F2" strokeWidth="2.6" />
      <circle cx="9" cy="9" r="2.6" fill="#6467F2" />
      <circle cx="16.4" cy="16.6" r="2.6" fill="#6467F2" />
      <path d="M9 11.6v3.2a1.8 1.8 0 0 0 1.8 1.8h3" stroke="#6467F2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
  if (id === 'nvidia') return (
    <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
      <path fill="#76B900" d="M12.6 8.1c-3.9 0-6.9 2.4-9.1 5.9 2.2 3.5 5.2 5.9 9.1 5.9h.2c3.9 0 6.9-2.4 9.1-5.9-2.2-3.5-5.2-5.9-9.1-5.9h-.2zm.1 9.6c-2.6 0-4.7-1.6-5.9-3.7 1.2-2.1 3.3-3.7 5.9-3.7 2.6 0 4.7 1.6 5.9 3.7-1.2 2.1-3.3 3.7-5.9 3.7z" />
      <path fill="#76B900" d="M2.5 7.3C4.9 4.1 8.2 2.1 12.7 2.1c4.5 0 7.8 2 10.2 5.2l.9-1.1C21.3 2.7 17.6.6 12.7.6 7.8.6 4.1 2.7 1.6 6.2l.9 1.1z" transform="translate(0 1)" />
    </svg>
  )
  return <Sparkles size={size} style={{ ...s, color: 'var(--text-muted)' }} aria-hidden="true" />
}

/* ── First-party providers (curated model lists) ───────────────── */
export const CORE_PROVIDERS = [
  {
    id: 'openai', name: 'OpenAI', color: '#10a37f',
    placeholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o',             label: 'GPT-4o' },
      { id: 'gpt-4o-mini',        label: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo',        label: 'GPT-4 Turbo' },
      { id: 'o1-mini',            label: 'OpenAI o1 Mini' },
      { id: 'gpt-3.5-turbo',      label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    id: 'gemini', name: 'Google Gemini', color: '#4285f4',
    placeholder: 'AIza...',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.0-flash',        label: 'Gemini 2.0 Flash (Fast & Free)' },
      { id: 'gemini-1.5-pro',          label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash',        label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b',     label: 'Gemini 1.5 Flash 8B (Lite)' },
      { id: 'gemini-1.0-pro',          label: 'Gemini 1.0 Pro (Legacy)' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic Claude', color: '#d97706',
    placeholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', color: '#ff7000',
    placeholder: '...',
    keyUrl: 'https://console.mistral.ai/api-keys',
    models: [
      { id: 'mistral-large-latest',   label: 'Mistral Large' },
      { id: 'mistral-small-latest',   label: 'Mistral Small' },
      { id: 'open-mixtral-8x7b',      label: 'Mixtral 8×7B' },
    ],
  },
]

/* ── Built-in aggregators: editable defaults with big catalogues ── */
export const AGGREGATOR_PROVIDERS = [
  {
    id: 'openrouter', name: 'OpenRouter', color: '#6467f2',
    placeholder: 'sk-or-v1-...',
    keyUrl: 'https://openrouter.ai/keys',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    editable: true, searchable: true, publicCatalog: true,
    note: '400+ models behind one key. Editable base URL; the model picker searches the live catalogue.',
    models: [
      { id: 'openai/gpt-4o',                 label: 'OpenAI GPT-4o' },
      { id: 'openai/gpt-4o-mini',            label: 'OpenAI GPT-4o Mini' },
      { id: 'anthropic/claude-3.5-sonnet',   label: 'Claude 3.5 Sonnet' },
      { id: 'google/gemini-2.0-flash-001',   label: 'Gemini 2.0 Flash' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
      { id: 'deepseek/deepseek-chat',        label: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek/deepseek-r1',          label: 'DeepSeek R1 (Reasoning)' },
      { id: 'mistralai/mistral-large',       label: 'Mistral Large' },
      { id: 'qwen/qwen-2.5-72b-instruct',    label: 'Qwen 2.5 72B' },
      { id: 'x-ai/grok-2-1212',              label: 'Grok 2' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free',  label: 'Llama 3.1 8B (free)' },
      { id: 'google/gemma-2-9b-it:free',     label: 'Gemma 2 9B (free)' },
      { id: 'qwen/qwen-2.5-7b-instruct:free', label: 'Qwen 2.5 7B (free)' },
      { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (free)' },
    ],
  },
  {
    id: 'nvidia', name: 'NVIDIA NIM', color: '#76b900',
    placeholder: 'nvapi-...',
    keyUrl: 'https://build.nvidia.com/',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    editable: true, searchable: true,
    note: 'build.nvidia.com — hosted NIM microservices. Editable base URL; searchable live catalogue.',
    models: [
      { id: 'meta/llama-3.3-70b-instruct',    label: 'Llama 3.3 70B Instruct' },
      { id: 'meta/llama-3.1-405b-instruct',   label: 'Llama 3.1 405B Instruct' },
      { id: 'meta/llama-3.1-8b-instruct',     label: 'Llama 3.1 8B Instruct' },
      { id: 'deepseek-ai/deepseek-r1',        label: 'DeepSeek R1' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B' },
      { id: 'mistralai/mistral-large-2-instruct', label: 'Mistral Large 2' },
      { id: 'qwen/qwen2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B' },
      { id: 'google/gemma-2-27b-it',          label: 'Gemma 2 27B IT' },
      { id: 'phi/phi-3.5-mini-instruct',      label: 'Phi 3.5 Mini' },
      { id: 'adept/fuyu-8b',                  label: 'Fuyu 8B (vision)' },
    ],
  },
]

/* ── Custom providers (user-defined, OpenAI-compatible) ────────── */
const CUSTOM_KEY = 'mf_ai_custom_providers'

export function loadCustomProviders() {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]')
    return Array.isArray(list) ? list.filter(p => p && p.id && p.name && p.baseUrl) : []
  } catch { return [] }
}
function saveCustomProviders(list) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list.slice(0, 10)))
}
export function addCustomProvider({ name, baseUrl, color }) {
  const list = loadCustomProviders()
  const id = `custom-${Date.now().toString(36)}`
  list.push({ id, name: name.trim().slice(0, 40), baseUrl: baseUrl.trim().replace(/\/+$/, ''), color: color || '#8e8e93', searchable: true, keyOptional: true })
  saveCustomProviders(list)
  return list
}
export function updateCustomProvider(pid, patch) {
  let list = loadCustomProviders()
  list = list.map(p => (p.id === pid ? { ...p, ...patch, baseUrl: (patch.baseUrl ?? p.baseUrl).trim().replace(/\/+$/, '') } : p))
  saveCustomProviders(list)
  return list
}
export function removeCustomProvider(pid) {
  let list = loadCustomProviders()
  list = list.filter(p => p.id !== pid)
  saveCustomProviders(list)
  return list
}

export function getAllProviders() {
  return [...CORE_PROVIDERS, ...AGGREGATOR_PROVIDERS, ...loadCustomProviders()]
}

/* ── Client-side URL validation (server re-validates authoritatively) ── */
export function validateBaseUrl(raw) {
  const url = String(raw || '').trim()
  if (!url) return 'Base URL is required.'
  if (/\s/.test(url)) return 'Base URL must not contain spaces.'
  if (!/^https?:\/\//i.test(url)) return 'Use a full URL starting with http:// or https://'
  try {
    const u = new URL(url)
    if (!/^https?:$/.test(u.protocol)) return 'Only http:// and https:// are supported.'
    if (u.username || u.password) return 'Remove the user:pass@ part from the URL.'
    if (u.pathname && u.pathname.replace(/\/+$/, '').length > 48) return 'That path looks too long — give the API root, e.g. https://host/v1'
    return null
  } catch { return 'That does not look like a valid URL.' }
}

/* ── Live model catalogue with cache + offline fallback ────────── */
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 h
const cacheKeyFor = (id) => `mf_ai_models_${id}`

function readCache(id, baseUrl) {
  try {
    const hit = JSON.parse(localStorage.getItem(cacheKeyFor(id)) || 'null')
    if (!hit || !Array.isArray(hit.models)) return null
    if ((hit.baseUrl || '') !== (baseUrl || '')) return null // base URL changed → stale
    if (Date.now() - hit.ts > CACHE_TTL) return null
    return hit.models
  } catch { return null }
}
function writeCache(id, baseUrl, models) {
  try { localStorage.setItem(cacheKeyFor(id), JSON.stringify({ ts: Date.now(), baseUrl: baseUrl || '', models: models.slice(0, 800) })) } catch { /* quota */ }
}

const toModelList = (payload) => {
  const arr = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : []
  const seen = new Set()
  const out = []
  for (const m of arr) {
    const id = m?.id || m?.name || m?.model
    if (!id || seen.has(id)) continue
    seen.add(id)
    const label = m?.name && m.name !== id ? `${m.name}` : id
    out.push({ id, label: String(label).slice(0, 60) })
  }
  return out
}

export async function fetchModelCatalog(provider, { baseUrl, apiKey } = {}) {
  const base = (baseUrl || provider.baseUrl || '').replace(/\/+$/, '')
  const fallback = provider.models || []
  const cached = readCache(provider.id, base)
  if (cached?.length) return { models: cached, source: 'cache' }

  if (!base) return { models: fallback, source: 'fallback' }
  // OpenRouter lists models publicly; everyone else needs the key
  const headers = {}
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  if (provider.id === 'openrouter') headers['HTTP-Referer'] = window.location.origin

  try {
    const res = await fetch(`${base}/models`, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`models endpoint returned ${res.status}`)
    const payload = await res.json()
    const models = toModelList(payload)
    if (!models.length) throw new Error('models endpoint returned no models')
    writeCache(provider.id, base, models)
    return { models, source: 'live' }
  } catch (e) {
    return {
      models: fallback,
      source: 'fallback',
      error: e?.name === 'TimeoutError' || e?.name === 'AbortError'
        ? 'Catalogue fetch timed out — showing the built-in list.'
        : `Catalogue fetch failed (${e?.message || 'network'}) — showing the built-in list.`,
    }
  }
}
