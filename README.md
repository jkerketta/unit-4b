# Unit 4B

A short first-person horror game with an original PlayStation (PSX) aesthetic: you move into a cheap apartment, a hidden room under the living-room rug hints the previous tenant never left, and the chase begins.

Unit 4B is a Vite + React + TypeScript app built on Three.js through React Three Fiber (R3F) and Drei, with Zustand state, Howler audio, the browser Web Speech API, and Vitest tests. It runs entirely in the browser with no backend of its own and takes roughly 10-15 minutes to finish.

## Quick Start

You need Node.js (a current LTS release) and npm. Get a playable build in four steps:

```bash
git clone https://github.com/jkerketta/unit-4b.git
cd unit-4b
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`) in a desktop browser. Click Start, then click the game view to capture the pointer.

## Installation

Install all dependencies:

```bash
npm install
```

No build step runs before the dev server; Vite compiles on demand.

## Usage

Run the dev server while you work:

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173` with hot reload. Browser audio and pointer lock require user interaction, so click Start, then click the canvas to capture the pointer before you can move.

### Production build

Type-check with `tsc -b`, then bundle with Vite:

```bash
npm run build
```

Output lands in `dist/`.

Serve the production bundle locally:

```bash
npm run preview
```

### Tests

Run the Vitest suite:

```bash
npm test
```

Tests run in jsdom (configured in `vite.config.ts`) and cover the game store, collision, entity AI, audio, and UI logic.

### Controls

The game supports desktop keyboard and mouse only.

| Action | Input |
| ------ | ----- |
| Move | WASD or arrow keys |
| Look | Mouse (pointer captured on click) |
| Sprint | Shift, drains stamina |
| Interact | E, hold when prompted |
| Pause | Esc |

### Game phases

State lives in `src/game/store.ts` (Zustand). The game walks through six phases:

```text
title -> intro -> calm -> chase -> win | gameover
```

`calm` is Act 1: unpack your boxes, read the lease, check under the rug, and open the hatch. `chase` starts when you enter the secret room. Win by reaching the front door and holding E to work the deadbolt. Lose by being caught: the entity triggers a jumpscare, and you retry from the checkpoint saved when the hatch first opened (Act 1 is never replayed).

### Project structure

The source is organized around its systems:

```text
src/
  game/        Zustand store, phases, constants
  systems/     Player controller, entity AI, audio, scares, interactions
  render/      PSX material, textures, shaders, postprocessing
  ui/          DOM overlays: HUD, title, pause, win, feedback form
  world/       Apartment layout, props, secret room
```

## Configuration reference

### Feedback endpoint

The win screen shows a feedback form with Name, Email, and Feedback. Device is captured automatically from the user agent and is not shown to the player. Submission POSTs JSON to a Google Apps Script web app that writes a row to a spreadsheet.

The endpoint resolves in `src/lib/feedback.ts`, where `VITE_FEEDBACK_ENDPOINT` takes precedence:

```ts
const fromEnv = import.meta.env.VITE_FEEDBACK_ENDPOINT
return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : DEFAULT_FEEDBACK_ENDPOINT
```

`DEFAULT_FEEDBACK_ENDPOINT` is a deployed Apps Script URL baked into the source, so feedback works on every build (local, preview, Vercel) without configuration. Point at a different script by setting the env var in `.env.local` (see `.env.example`):

```bash
VITE_FEEDBACK_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

The script must accept the POST with `Content-Type: text/plain` (used to avoid a CORS preflight) and answer 2xx after its redirect. Payload:

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "feedback": "Great atmosphere, terrifying hatch.",
  "device": "Mozilla/5.0 ... | touch",
  "total_time_sec": 540,
  "escape_sec": 240,
  "completed_at_iso": "2026-08-02T23:59:00.000Z",
  "submitted_at_iso": "2026-08-02T23:59:01.000Z"
}
```

`total_time_sec` measures from the start of the intro to the win screen. `escape_sec` measures from the start of `calm` to the win. The two timestamps record when the game completed and when the form was submitted.

## Attribution

Audio assets and their generation details are documented in [`public/audio/ATTRIBUTION.md`](public/audio/ATTRIBUTION.md).

- Kenney Furniture Kit models (CC0): [`public/models/kenney/LICENSE.md`](public/models/kenney/LICENSE.md)
- Office Phone model by dook (CC BY 3.0): [`public/models/poly-pizza/LICENSE.md`](public/models/poly-pizza/LICENSE.md)

## Known limitations

- Desktop keyboard and mouse are the only input method. Touch and gamepad are not implemented.
- Pointer lock and speech synthesis vary by browser. When no speech voice is installed, the landlord voicemail still plays as subtitles over its audio bed.
- The presentation uses a deliberately low internal resolution (canvas `dpr` 0.25) and low-poly assets for the PSX look.
- The custom postprocessing pipeline in `src/render/PSXPipeline.tsx` is defined but not mounted, pending cross-browser runtime verification.

## Contributing

Unit 4B is a private project. For fixes and ideas, open a PR against `main`:

1. Branch from `main`.
2. Write tests for logic changes (`npm test`).
3. Confirm the app type-checks and builds (`npm run build`).

Commit messages follow conventional commits (`feat:`, `fix:`, `ui:`, `test:`).

## License

The project source carries no license file; all rights reserved. Third-party assets ship under their own licenses, credited in Attribution.
