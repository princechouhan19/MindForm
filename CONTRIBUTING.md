# Contributing to MindForm

**MindForm is closed-source and developed privately.** Public pull requests
are not accepted, and the repository is not open to outside contributors.
This document describes how the **internal team** works, and how anyone else
can still report bugs or propose ideas.

## For the public: reporting bugs & ideas

We genuinely want your feedback — you just can't commit code:

- **Bugs** — email `princechouhan4606@gmail.com` with: what you did, what you
  expected, what happened, browser/OS, and the URL. Screenshots help.
- **Security issues** — follow the private disclosure process in
  [SECURITY.md](SECURITY.md) (please do not open public discussions for them).
- **Feature ideas** — email or use the in-app feedback link. Describe the
  problem you're solving, not just the feature.

## For the internal team

### Branches & commits

- Branch from `main`: `feat/<area>-<summary>`, `fix/<area>-<summary>`,
  `chore/<summary>`.
- Commits follow the existing conventional style:
  `fix(auth): ...`, `feat(mcp): ...`, `docs(backend): ...`.
- Keep commits reviewable — one logical change per commit.

### Pull requests

1. Describe **why**, not just what.
2. Run the frontend build (`npm run build`) — it must succeed with no new
   chunk-cycle errors.
3. Walk the manual checklist in `docs/development.md` for anything user-facing.
4. One reviewer's approval is required before merge to `main`
   (deploys are automatic — see `docs/deployment.md`).

### Code expectations

- Follow the conventions in `docs/development.md` (branches, style, shared
  libs, no `alert()`).
- Documentation is part of the feature: if you touch providers, MCP tools,
  routes or data models, update the matching `docs/*.md` **and** the in-app
  docs (`frontend/src/views/DocsView.jsx`), plus the FAQ mirror in
  `frontend/index.html` when copy changes.
- Security-sensitive code (auth, keys, SSRF guard, rate limits) requires a
  second pair of eyes in review — no solo merges.

### Issue hygiene

Labels: `bug`, `ui/ux`, `coach`, `mcp`, `speak`, `social`, `docs`, `perf`.
Close issues only via a commit reference or an explicit resolution note.
