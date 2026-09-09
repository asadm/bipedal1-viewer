# Integrated hip actuator alternatives — not adopted

Source check: 2026-09-09 UTC. These are leads for reducing total assembly work,
not a motor selection or a claim that they meet the robot's motion requirements.

The current X2216 plus four stock gears costs $70.75 per hip before the separate
FOC driver, encoder, couplers, shaft, bearing supports and retention. Compare a
complete actuator against that finished subsystem rather than the $24.99 bare
motor. A direct replacement may require changing the stationary internal-tie
support: the current fixed spindle passes through the rotating hip hub. Whether
these actuators offer a compatible through passage has now been checked for
RS05: its supplier CAD obstructs the current 8 mm stationary spindle.

| Official product | Listed price | Mass | Size | Peak torque | Supply |
|---|---:|---:|---|---:|---|
| [EduLite 05](https://www.robstride.com/products/eduLite05) | $80 | 242 g | 46 × 46 × 44 mm | 6 N·m | 15–60 V, rated 48 V |
| [RobStride 05](https://www.robstride.com/products/robStride05) | $110 | 191 g | 46 × 46 × 44 mm | 5.5 N·m | 15–60 V, rated 48 V |

Both integrate reduction, motor control and two magnetic encoders. EduLite uses
a 9:1 powder-metallurgy gearbox; RS05 uses 7.75:1 machined steel. The supplier's
July 2026 GitHub specification lists RS05 rated torque as 1.8 N·m, while its
website and detailed July manual say 1.6 N·m with a 70 × 70 mm heat sink.
Use the lower rating until that discrepancy is resolved before adoption.
Do not confuse peak torque with continuous operation or an impact rating.

The $80 option is only $9.25 above the unfinished motor-and-gears subtotal; the
$110 option is $39.25 above it. Those are arithmetic comparisons, not delivered
quotes or verified savings. Extra structure/power electronics, shipping and tax
may change the result. No purchase or vendor contact has been made.

The current 3S electrical design is below their minimum supply. Their 430/480 rpm
no-load figures are at rated voltage, not at the proposed battery voltage. The
prescribed jump already calls for about 178 rpm at the hip, so a lower-voltage
loaded torque–speed calculation is required before calling either suitable.
Battery dimensions, wheel-driver voltage compatibility, regeneration and
actuator bearing moment capacity also need checking.

Useful next comparison: the finished two-stage custom drive versus an integrated
actuator with a revised stationary tie support. An offset 1:1 transmission is
another possibility if a fixed through-spindle cannot be accommodated, but it
would reintroduce gears and must be counted honestly. Retain four robot motors
in either comparison; this is about simplifying each hip actuator.

`sources.json` binds the archived official pages and application bundle. The HTML
files are SPA shells, so product parameters are also retained as exact object
extracts from the official bundle. `rs-specs.md` is the official RobStride
Product_Information README. `manual-cad-sources.json` binds the subsequently
downloaded RS05 manual, STEP and EduLite photograph. The imported RS05 CAD and
torque/speed calculations are documented in [the comparison](../../integrated-hip/README.md).
`power-source-manifest.json` binds two power-system product leads; neither is selected.
