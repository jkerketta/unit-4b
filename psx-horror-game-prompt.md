# Agent Prompt: "Unit 4B" — PSX-Style Apartment Horror Game

## Role & Context
You are building a short, self-contained 3D horror game in the style of **Chilla's Art** and **Puppet Combo** — low-poly PSX aesthetic, single confined location, a two-act structure (calm exploration → chase/escape), and 2–4 scripted jumpscares. Think "PS1 survival horror demo," not a AAA game. Scope is intentionally small; prioritize atmosphere and a working core loop over content volume.

## Tech Stack
- **React + TypeScript**
- **React Three Fiber (R3F)** + `@react-three/drei` for helpers (useGLTF, PointerLockControls, Text, etc.)
- **Three.js** as the underlying renderer
- **Zustand** for game state (game phase, objectives, entity AI state, player health/stamina)
- **Howler.js** (or native Web Audio via `use-sound`) for SFX/ambient audio layering
- **@react-three/postprocessing** for the PSX look (see Art Direction below)
- Vite for bundling

## Art Direction — PSX Look (be specific, this is the hardest part)
Implement genuine PS1-era rendering constraints, not just "low poly":
1. **Low internal resolution** — render to a small offscreen target (e.g. 320x240 or 480x270) and upscale with nearest-neighbor filtering for pixelation.
2. **Vertex jitter/snapping** — snap vertex positions to a coarse grid in the vertex shader to emulate PS1's lack of sub-pixel precision (geometry "wobble" on camera movement).
3. **No texture filtering** — `NearestFilter` on all textures, no mipmaps.
4. **Affine texture mapping look** (optional stretch goal) — via custom shader if time allows; skip if it slows the agent down.
5. **Vertex-lit, no PBR** — flat/vertex color lighting, no normal maps, no realtime shadows (bake fake shadow blobs or vertex-darken instead).
6. **Fog** — aggressive `THREE.Fog` to hide draw distance and build dread; period-accurate (PS1 used fog to hide clipping).
7. **Low poly counts** — target sub-500 tris per prop, sub-2000 for the entity model.
8. **Dithering post-process pass** — ordered/Bayer dithering shader instead of smooth color gradients.
9. **CRT-lite touches (optional)** — slight chromatic aberration + scanlines via postprocessing, kept subtle.

## Storyline: "Unit 4B"
**Premise:** The player just signed a lease and moved into Unit 4B — good price, landlord closed the deal unusually fast. First night, while unpacking, the player finds a **hidden door** (behind a bookshelf, under a rug hatch, or a closet with a false back) that isn't on the floor plan they were given. It leads to a windowless room the previous tenant clearly used to hide something. Going far enough into that room — or taking something from it — wakes something that's been living in the walls/crawlspace, and it wants the player out.

**Two-act structure:**
- **Act 1 — Calm (exploration):** Player moves in, unpacks, explores the apartment, and pieces together small environmental oddities and lease paperwork that hint something is off. No threat is active yet. This act ends when the player finds and enters the secret room.
- **Act 2 — Chase (escape):** Entering the secret room flips a global game-phase flag from `calm` to `chase`. From this point, the entity is active and hunting. The player's goal shifts entirely to reaching the front door / fire escape and getting out alive.

**Story delivery (environmental, no exposition dumps):**
- Lease paperwork with a redacted previous-tenant name.
- Notes/photos/personal effects inside the secret room hinting at why the last tenant vanished.
- One landlord voicemail that plays mid-chase — a short, cheap-but-effective gut-punch line (e.g. "If you found the room... just leave the keys under the mat.").

**Win/lose conditions:**
- **Win:** Reach the escape point (front door or fire escape) after the chase phase begins.
- **Lose:** Caught by the entity → jumpscare → game over screen → retry from a checkpoint set right before the secret room reveal (so the player doesn't replay all of Act 1).

## Core Systems to Build

### 1. Title Screen
- Static/looping low-poly scene or simple logo card, PSX-filtered.
- "Start", "Controls", "Quit/Credits" — minimal menu, ambient drone audio.

### 2. Game Phase & Objective System
- Zustand store holds a single top-level `phase: 'calm' | 'chase' | 'win' | 'gameover'` flag — this is the backbone of the whole game.
- `objectives: {id, label, complete}[]` drives Act 1: e.g. "Unpack boxes," "Find the lease documents," "Locate the hidden door."
- Finding/entering the secret room is the objective that flips `phase` from `calm` to `chase`. This single transition gates the entity's AI (inactive in `calm`, active in `chase`) and swaps the HUD/objective from "explore" prompts to "get out" urgency.
- On-screen objective prompt (diegetic — a note/journal-style UI rather than a quest log, to stay in-genre).

### 3. Player Controller
- First-person, `PointerLockControls` or custom FPS controller.
- Walk + sprint with a stamina meter (sprinting is precious — creates tension in Act 2).
- Simple interact system (raycast from camera, "E to interact" prompts) — used for unpacking boxes, reading notes, and triggering the hidden door mechanism.
- Optional: hide spots (closet, under bed) as an evasion mechanic during the chase.

### 4. Hidden Door Mechanic
- A single interactable object (bookshelf / rug hatch / false closet back) with a `revealed: boolean` in the store.
- Reveal can be gated by a small environmental puzzle (move furniture, find a key, notice a suspicious wall panel) — keep it to one simple step, not a multi-part puzzle chain.
- Once revealed and entered, triggers the `calm → chase` phase transition described above.

### 5. Entity AI — only active in Act 2
Build as an explicit state machine, gated entirely by `phase`:
- **States:** `dormant → alert → search → chase → attack/caught`
- **Dormant:** default state during `phase: 'calm'` — entity does nothing, isn't even instantiated/active in the scene, so Act 1 has zero performance or design overhead from it.
- **Alert:** triggered the moment `phase` flips to `chase` (entity "wakes up" somewhere in the apartment, e.g. the secret room itself).
- **Chase:** direct pathing toward the player. Keep pathing simple — a room-graph with waypoints is far more reliable to implement than full pathfinding, and fits the low-fi aesthetic. No need for full navmesh baking for one apartment.
- **Attack:** proximity/collision trigger → jumpscare sequence → `phase: 'gameover'`.
- Because the entity is fully inactive during Act 1, you can build and test Act 1 (exploration, objectives, hidden door) completely independently of Act 2 (AI, chase, escape) — this is a natural, low-risk way to phase the build.

### 6. Jumpscares (2–4 total)
- **Scripted scare #1:** inside the secret room itself, on discovery (before the entity is even active) — pure "you shouldn't be looking at this" dread beat.
- **Scripted scare #2 (optional):** the moment the entity wakes, e.g. a brief glimpse/silhouette as `phase` flips to `chase`.
- **Dynamic scare:** entity catches the player during Act 2 → `phase: 'gameover'`.
- Implementation: camera shake + full-screen entity model/texture flash + stinger SFX, then forced state transition. Keep each scare short (<1s visual) — sound design sells it more than the visual.

### 7. Audio
- Act 1: quiet, mundane ambient room tone (fridge hum, distant traffic, unpacking sounds) — deliberately unthreatening to sell the contrast when Act 2 begins.
- Act 2: footstep SFX (player + entity, different pitch/volume so the player can audio-cue proximity), tension-building ambient shift.
- Stinger SFX for jumpscares.
- The landlord voicemail as a scripted mid-chase audio beat.
- Optional heartbeat SFX that intensifies with entity proximity during Act 2 — cheap but effective.

### 8. UI/UX
- Minimal HUD: objective prompt (Act 1) or "get out" urgency prompt (Act 2), interact prompt, stamina bar.
- Pause menu, death/retry screen (respawns at the checkpoint just before the secret room), win/escape screen.

## Suggested Build Order (phase the work — don't build everything at once)
1. **Scaffold** — Vite + R3F project, Zustand store skeleton (including the `phase` flag), basic FPS controller in an empty room.
2. **PSX render pipeline** — low-res render target, nearest filtering, fog, dithering pass. Get this looking right early since it affects all asset decisions after.
3. **Apartment greybox** — block out rooms/collision with primitive geometry, including the secret room space.
4. **Act 1 loop end to end** — unpack/objective interactions, lease notes, hidden door reveal + entry, with placeholder art. Fully playable and testable without any AI.
5. **Phase transition + entity state machine** — wire the `calm → chase` flip, build patrol/alert/chase/attack logic in the greybox level.
6. **Jumpscare implementation** — secret-room discovery scare first (easiest, no AI dependency), then the wake-up scare, then the dynamic catch-scare.
7. **Audio pass** — Act 1 ambient, Act 2 tension audio, stingers, landlord voicemail.
8. **Art pass** — swap greybox for final low-poly props/entity model.
9. **Title screen, menus, checkpoint/retry flow, polish, playtesting pass.**

## Constraints for the Agent
- Favor small, testable increments — after each phase, the game should run and be playable, even if ugly.
- Don't over-engineer the entity AI (no full navmesh baking, no A* over a nav grid unless the room-graph approach proves insufficient).
- Don't scope-creep the apartment into multiple floors/large spaces, and don't add dynamic/shifting level geometry — one static, contained unit with one static secret room only.
- Keep the hidden-door puzzle to a single simple step — this is a mood beat, not a puzzle game.
- Ask before adding new major dependencies beyond the stack listed above.
