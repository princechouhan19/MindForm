# Legal notices

Plain-language legal context for MindForm, its data practices and the
third-party software it builds on. The product-facing summaries live at
`/privacy` and `/terms` in the app (source: `frontend/src/views/SubPages.jsx`).

## Software status

- MindForm is **proprietary, closed-source software** — see
  [LICENSE.md](LICENSE.md). "Free to use" refers to the hosted service; it
  grants no rights to the code.
- Trademarks: "MindForm", the logo and branding belong to the copyright
  holder. Third-party product names (OpenAI, Google Gemini, Anthropic Claude,
  Mistral, OpenRouter, NVIDIA, Claude Desktop, Cursor, Codex, Antigravity…)
  belong to their respective owners and are referenced nominatively.

## Data & privacy summary

- Accounts store email, display name and bcrypt-hashed passwords only.
- Product data (tasks/habits/goals/streak/Speak logs) is scoped to the user ID.
- BYOK AI keys are browser-local; MCP keys are stored as SHA-256 hashes.
- AI chat history TTL: 24 h. Forum messages TTL: 48 h.
- Camera recordings (Speak) never leave the device.
- No advertising trackers; no data sales.
- The full policy is at `/privacy` in the app.

## AI features disclaimer

Coach (and any MCP-connected agent) can produce incorrect content. All writes
require explicit user approval in-app; MCP keys act with the permissions the
user grants them. The operator is not responsible for decisions taken on AI
advice.

## Health disclaimer

The Speak module provides general voice exercises for informational purposes
only and is not medical advice. Users experiencing pain or voice conditions
should consult a qualified professional.

## Third-party open-source software

MindForm's own code is proprietary, but it depends on these open-source
packages (all used unmodified, under their standard licenses):

| Package | License | Use |
| :--- | :--- | :--- |
| React, React DOM | MIT | UI runtime |
| Vite, @vitejs/plugin-react | MIT | build tooling |
| Express | MIT | API framework |
| Mongoose | MIT | MongoDB ODM |
| mongodb-memory-server | Apache-2.0 | dev-only in-memory Mongo |
| jsonwebtoken | MIT | JWT sessions |
| bcryptjs | MIT (BSD-style) | password hashing |
| helmet | MIT | security headers |
| cors | MIT | CORS middleware |
| express-rate-limit | MIT | rate limiting |
| express-mongo-sanitize | MIT | NoSQL injection sanitisation |
| compression, morgan, cookie-parser, dotenv | MIT | HTTP middleware & config |
| gsap | Standard "GSAP" license (free tier) | landing motion |
| lenis | MIT | smooth scrolling |
| Recharts | MIT | dashboard charts |
| framer-motion | MIT | micro-animations |
| lucide-react | ISC | icon set |
| react-intersection-observer | MIT | scroll reveals |

Full license texts ship inside each package under `node_modules/<pkg>/LICENSE`
and are reproduced in the deployed bundle's notice file where applicable.
MCP client integrations reference `mcp-remote` (MIT) as a runtime npx
dependency for Claude Desktop.

## Contact

Legal questions: **princechouhan4606@gmail.com**
