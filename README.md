# ecircutry — Tactile STEM & Electronics Lab (Tiers 1–4)

Playable live via GitHub Pages: **https://jam231.github.io/ecircutry/**

A mobile-first (iPhone, iPad, desktop PWA) interactive electronics & signal engineering game powered by a real **Modified Nodal Analysis (MNA)** physics engine — featuring switchable **English (`EN`) / Polish (`PL`)** localization and bilingual audio narration:

- **Adult Lab — 30 Progressive Labs across 4 Tiers**:
  - **Tier 1 — DC Foundations (Labs 01–08)**: Closed loops, Ohm's Law, LED forward voltages, series vs. parallel, mixed loads, rheostat dimming, series `AND`, parallel wiring.
  - **Tier 2 — Dividers, Power & Sensors (Labs 09–15)**: Equivalent resistance, voltage dividers, Thévenin loading sag, $0.25\,\text{W}$ resistor power limits, 3-pin SPDT staircase `XOR` switches, LDR light sensors, and NTC thermistors.
  - **Tier 3 — Transistors & Logic (Labs 16–22)**: Smooth Ebers-Moll 3-pin NPN BJT amplification, auto streetlight, buffered cooling fan, real transistor `NOT`, `NAND`, `NOR` gates, and bistable 1-bit `SR Latch` memory.
  - **Tier 4 — Time, AC & RF Resonance (Labs 23–30)**: Capacitors & RC fade, $\tau = RC$ stopwatch, self-oscillating 2-NPN astable blinker, AC-to-DC rectifier smoothing, inductive flyback diode clamping, RC Low-Pass / High-Pass filters with phase shift, and a tuned RLC radio resonator ($f_0 = \frac{1}{2\pi\sqrt{LC}}$).
- **Kid Mode (`Dla Dzieci`) — 13 Zero-Reading Narrated Missions (Chapters 1–4)** + Free Play Toybox.
- **Bench Instruments**: Live **X-Ray** current flow & node voltages, pocket **DC Multimeter**, **Dual-Channel Oscilloscope (`TIME`)** + exact **Complex-MNA Bode Sweep (`BODE`)**, and contextual **Sun/Moon** & **Cold/Hot** sensor sliders.

See [DESIGN.md](./DESIGN.md) for architecture details.

## Local Development

```bash
npm install
npm test      # Run Vitest physics, Bode, and Tier 1–4 level solvability suite
npm run lint  # Run oxlint
npm run dev   # Start Vite hot-reload dev server
npm run build # Build static bundle to dist/
```
