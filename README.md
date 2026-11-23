# ecircutry — Tactile STEM & Electronics Lab

Playable live via GitHub Pages: **https://jam231.github.io/ecircutry/**

A mobile-first (iPhone, iPad, desktop PWA) electronics learning game powered by a real DC Modified Nodal Analysis (MNA) circuit solver, built for two modes sharing one engine:

- **Adult Lab**: 8 progressive DC puzzles (*Ohm's Law, LED current limiting, series vs. parallel circuits, mixed loads, rheostat dimming, switch logic*) + **X-Ray** current flow, pocket **DC Multimeter HUD**, **"Why? (Show Math)"** live formulas, and Free Lab Sandbox.
- **Kid Mode (Age 6+)**: 5 zero-reading visual missions with animated icon goals, gentle pulsing wire guides, forgiving auto-heal on burnout, and a Free Play Toybox.
- **Procedural Web Audio**: Synthesized pin snaps, mechanical switch clicks, voltage-reactive motor whirr & piezo buzzer tones, LED pop/sizzle, and victory chimes.

See [DESIGN.md](./DESIGN.md) for the full architecture and physics overview.

## Local Development

```bash
npm install
npm test      # Run Vitest physics & level solvability suite
npm run dev   # Start Vite hot-reload dev server
npm run build # Build static bundle to dist/
```
