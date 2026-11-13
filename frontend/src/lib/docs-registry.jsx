import { BookOpen, Cable, Brain } from 'lucide-react'

/* Docs route registry — tiny and eager so App.jsx can route /docs*
   without loading the (lazy) DocsView content chunk. */
export const DOCS_PAGES = [
  { path: '/docs',          title: 'Documentation',      icon: BookOpen,  desc: 'Guides for MindForm\u2019s AI layer: the Coach assistant and the MCP server that plugs your plan into Claude, Cursor, Codex and Antigravity.' },
  { path: '/docs/mcp',      title: 'MCP Server',         icon: Cable,     desc: 'Connect Claude Desktop, Cursor, Codex CLI, Antigravity or any MCP client to your MindForm account with a personal key.' },
  { path: '/docs/ai-coach', title: 'AI Coach',           icon: Brain,     desc: 'Bring your own key \u2014 OpenAI, Gemini, Claude, Mistral, OpenRouter, NVIDIA NIM or any OpenAI-compatible provider \u2014 and let Coach plan and edit with your approval.' },
]
