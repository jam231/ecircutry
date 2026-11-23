# ecircutry — Architecture & Design Reference

`ecircutry` is a mobile-first tactile STEM and DC electronics learning game designed around **two modes sharing one physics engine**:

- **Adult Lab ("Practical DC Lab")**: Bite-sized 5-minute contraption puzzles covering Ohm's Law, LED current limiting, series vs. parallel circuits, mixed loads, rheostat metering, and switch logic — backed by X-Ray flow visualization, a pocket DC Multimeter HUD, and an on-demand *"Why? (Show Math)"* drawer.
- **Kid Mode ("Little Inventor")**: Zero-reading visual missions and a forgiving toybox using the same clean realistic breadboard components, animated icon goals, tactile push buttons, spinning fans, and playful non-punishing feedback.

## Project Structure

- `src/engine/circuitSolver.ts` — Real DC Modified Nodal Analysis (MNA) solver using Norton-equivalent batteries with realistic internal resistance, $0.02\,\Omega$ jumper wires for exact KCL branch currents, and iterative piecewise-linear diode convergence for LEDs.
- `src/engine/resistorColors.ts` — Authentic 4-band EIA resistor color-code calculator and unit formatters.
- `src/core/soundEngine.ts` — Procedural Web Audio synthesizer (pin snaps, switch clicks, LED pop/sizzle, short-circuit sparks, chimes, and continuous voltage-reactive motor/buzzer audio).
- `src/core/stemModule.ts` — Extensible module registry allowing future STEM disciplines (Chemistry, Mechanics) to plug into the same dual-mode app shell.
- `src/data/electronicsLevels.ts` — 8 handcrafted Adult DC Lab puzzles, 5 Kid Mode visual missions, and dual-mode Sandboxes.
- `src/components/` — Interactive SVG breadboard (`BreadboardView.tsx`), realistic hardware vector art (`ComponentArt.tsx`), parts dock (`PartsTray.tsx`), pocket multimeter (`MultimeterHud.tsx`), math drawer (`MathDrawer.tsx`), and level selector (`LevelModal.tsx`).

## Running Locally

```bash
npm install
npm test      # Run Vitest physics solver tests
npm run dev   # Start Vite dev server
npm run build # Type-check & production bundle
```
