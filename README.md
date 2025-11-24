# BlackBox AI Playground

This app is a standalone playground shell for BlackBox AI. It lets you point the UI at any compatible backend via a simple config screen, then chat, stream responses over WebSocket, and manage threads without rebuilding.

## Features
- Config page for API + WebSocket endpoints, default source ID, and user email (persists in `localStorage` under `playground-config`).
- Live playground route (`/playground/:source_id`) with chat streaming, history, prompt optimization, and file attachment UX.
- Environment-variable fallbacks so you can ship a prewired build but override at runtime.
- Built with React 19, Vite 6, Tailwind 4, Zustand state, Radix UI primitives, and lucide icons.

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm (comes with Node)

## Quick start
1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` (or copy/update the existing one) with your backend defaults:
   ```sh
   VITE_PLAYGROUND_API_URL="https://your-api.example.com"
   VITE_PLAYGROUND_WB_URL="wss://your-ws.example.com/ws"
   ```
3. Run the dev server (Vite on port 5174):
   ```sh
   npm run dev
   ```
4. Open http://localhost:5174/playground/config to set or override endpoints, default source ID, and user email, then click **Launch playground**.

## Scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – production build.
- `npm run preview` – preview the production build locally.

## Key routes
- `/playground/config` – Configure API base, WebSocket URL, default `source_id`, and user email (runtime overrides saved to local storage).
- `/playground/:source_id` – Playground experience. Uses config overrides if present; otherwise falls back to build-time env vars.

## Runtime configuration
- Fallbacks come from `VITE_PLAYGROUND_API_URL` and `VITE_PLAYGROUND_WB_URL` at build time.
- Runtime overrides are stored in `localStorage` (`playground-config`) and resolved via:
  - `resolvePlaygroundApiUrl()`
  - `resolvePlaygroundWsUrl()`
  - `resolvePlaygroundUserEmail()`

## Backend expectations
- REST: `/api/chats/:user` and `/conversation/:user/:thread` for history + replay.
- WebSocket: `wss://<host>/ws/<user>/<thread?>` for streaming chat.
- Optional: `/api/prompt/optimize` for prompt improvement.
- Ensure CORS allows the frontend origin.

## Project structure (high level)
- `src/pages/playground/config.tsx` – Config screen.
- `src/pages/playground/index.tsx` – Standalone playground page shell.
- `src/components/playground/Playground.tsx` – Main chat UI and socket handling.
- `src/store/playgroundConfigStore.ts` – Config state + env fallbacks.

## Notes
- Dev server is configured to run on port 5174 (`vite.config.ts`).
- Tailwind 4 is used via the Vite plugin; base styles come from `tailwind.config.ts`.


## SS

<img src="./img/Screenshot 2025-11-24 at 2.25.13 PM.png" alt="StarPlayground" />
