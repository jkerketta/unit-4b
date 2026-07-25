# Unit 4B

Unit 4B is a short first-person PSX-style horror game. You have just moved into a cheap apartment, but an inconsistency in the lease and a hidden room beneath the floor suggest that the previous tenant never truly left.

## Controls

- `WASD` or arrow keys — move
- Mouse — look
- `Shift` — sprint
- `E` — interact; hold when prompted
- `Esc` — pause
- Click the game view after starting or resuming to capture the pointer

## Setup and commands

Requires a current Node.js LTS release and npm.

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```

`npm run dev` starts the Vite development server. `npm run build` type-checks and creates a production bundle in `dist/`; `npm run preview` serves that bundle locally.

## Tech stack

- React and TypeScript
- Three.js with React Three Fiber and Drei
- Zustand
- Howler.js and the browser Web Speech API
- Vite and Vitest

## Attribution

Audio attribution and generation details are in [`public/audio/ATTRIBUTION.md`](public/audio/ATTRIBUTION.md).

The low-poly furniture models are from Kenney's CC0 Furniture Kit; license details are in [`public/models/kenney/LICENSE.md`](public/models/kenney/LICENSE.md).

## Known limitations

- Desktop keyboard and mouse play is the supported input method; touch and gamepad controls are not implemented.
- Pointer lock and speech synthesis behavior varies by browser. If no speech voice is available, the voicemail still displays as subtitles over its audio bed.
- The game uses deliberately low internal resolution and low-poly assets for its PSX presentation.
- The custom postprocessing pipeline remains disabled pending cross-browser runtime verification.
