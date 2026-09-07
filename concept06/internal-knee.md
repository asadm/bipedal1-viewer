# Concealed knee lever: revised mechanism study

The current full robot and round wheel drives were committed as `0035463`
before starting this investigation. This study is separate from that CAD and
its MuJoCo recordings. Open `/viewer/knee.html` on the existing port-8765 server
to inspect and animate one leg.

A later [full-assembly integration](internal-full.md) uses a 15.16 mm lever, an 8 mm knee shaft and revised closures. This document retains the earlier isolated 14 mm geometry.

## What the references establish

`ref/IMG_3974.jpeg` shows a lever inside Beni's thigh. `IMG_3970.jpeg` describes
a second brushless motor powering the knee. This establishes an internal knee
transmission, but the images do not provide a complete linkage diagram.
Our proposal preserves four locomotion motors by using a **passive** internal
guide. The body pivot is fixed; the powered thigh drives the four-bar and folds
the lower leg. This is inspired by the packaging, not a claim to reproduce Beni.

## The geometry to investigate next

| Dimension | Previous external guide | Internal candidate |
|---|---:|---:|
| Thigh pivot spacing | 64.48 mm | 64.48 mm |
| Lower leg length | 119.12 mm | 119.12 mm |
| Passive guide centres | 83.50 mm | 65.30 mm |
| Knee lever | 28.22 mm | 14.00 mm |
| Lever angle relative to lower leg | 180° | 197.4° |
| Fixed body pivot from hip, X / Z | 22.69 / 45.00 mm | 17.30 / 11.60 mm |
| Calculated vertical travel | 99.81 mm | 100.20 mm |

Angling the lever 17.4° away from a straight backward extension provides a much
better result than shrinking the original linkage proportionally. The wheel
path differs by at most **1.90 mm at the same hip angle**. Independent left/right
hip control is retained; no extra knee motor or additional moving link is needed.

The thigh outline grows locally from Ø46 to Ø58 at the hip, and Ø30 to Ø44 at
the knee. This is the actual packaging tradeoff for removing the long external
guide and tall anchor ear. It remains a compact tapered envelope. It is not an
unchanged-envelope claim or a completed printable shell.

## Clearance and spring screening

The nominal calculation samples 501 hip angles from 0.35 to 1.50 radians:

- Minimum guide-to-inner-wall clearance: **0.97 mm**, including a 2 mm wall and
  the full 10 mm guide width.
- Minimum guide-to-Ø21 hip-neck clearance: **1.11 mm**. The wider Ø28 hip hub
  starts at Y=75.5 mm, beyond the guide and clevis plates.
- Maximum spring compression: **18.72 mm**, below the 20 mm design limit.
- Spring and guide occupy different lateral planes: guide Y=67–71 mm, spring
  nominal envelope Y=75.5–87.5 mm. The nominal lateral gap is **4.5 mm**.
- Proposed clevis plates end at Y=74.5 mm, giving **1 mm** nominal lateral
  clearance to the spring. The spring centre moves from 78.5 to 81.5 mm and the
  outer face from 89 to 91 mm. This small lateral move is necessary to clear
  the outer knee-clevis plate.

The illustrative structural thigh spine lies inboard at Y=59–63 mm. It connects
the hip neck to the knee support without crossing the guide's Y=67–71 mm plane.
A transverse knee web through that plane would obstruct the guide and is not
used in this layout. Attachment to the final shell and body clearances remain
part of full CAD integration.

The SWF12-50 remains the spring: 50 mm free length, 5.5 N/mm nominal stiffness.
The [MISUMI SWF catalog](https://jp.misumi-ec.com/pdf/press/2017/17_pr1551.pdf)
lists 20, 22.5 and 25 mm deflection columns for that size. We retain the
conservative 20 mm limit; the catalog maximum is not the design target.

An additional deterministic sample of 200 tolerance variants uses independent
±0.1 mm body-anchor coordinates, guide length and lever length, plus ±0.25°
lever indexing, each checked at 51 poses. All close and pass the evaluated
limits. Worst sampled values are 0.87 mm wall clearance, 0.98 mm neck clearance
and 19.52 mm spring compression. These samples do not cover every tolerance,
spring-diameter growth, deflection, backlash or manufacturing stackup.

The earlier 8.47 mm lever proposal is **rejected for direct adoption**. Checking
its whole guide, rather than just its endpoint footprint, reveals about 0.93 mm
interference with even the bare Ø8 hip shaft. Its prior side-profile fit was
insufficient to establish a workable assembly.

## Use metal for the compact load path

Proposed starting section: **10 × 4 mm steel guide**, with 6.1 mm holes for
nominal 6 mm hardened pins supported on both sides. The link is a cut/drilled
strip, not a purchased part with a qualified rating. Guide centres are 65.3 mm;
length over rounded ends is about 75.3 mm. Allow roughly 21 g before holes per
guide using an assumed steel density of 7.85 g/cm³.

At equal knee torque, guide force rises by up to **3.05×** relative to the
external linkage, versus 4.34× in the first shrunken proposal. A long plastic
guide of this thin section is not an appropriate robustness assumption.

The following are conservative static moment bounds, not predicted landing
loads. Each sums magnitudes of the vertical wheel-load moment, compressed
spring moment and a 0.45 N·m wheel-drive reaction, then divides by the actual
perpendicular knee moment arm. Robot mass is assumed 2.1 kg; the lowest effective
lever arm is 8.37 mm. Link inertia and fore/aft contact forces are omitted.

| Assumed total vertical load distribution | Maximum guide-force bound |
|---|---:|
| 1× robot weight, shared equally | 481 N |
| 3× robot weight, shared equally | 740 N |
| 6× robot weight, shared equally | 1,129 N |
| 6× robot weight, all on one wheel | 1,907 N |

The last case gives 122 MPa nominal net-section stress through a 6.1 mm hole.
For context, [SSAB Domex 355MC](https://www.ssab.com/en/brands-and-products/ssab-domex/product-offer/355mc)
specifies 355 MPa minimum yield for 4 mm material. This comparison does **not**
qualify the link: hole stress concentration, fatigue, surface finish, bending,
load eccentricity and actual stock grade are not accounted for.

An ideal pin-ended buckling calculation gives 24.7 kN for this section using an
assumed steel modulus of 200 GPa. The same geometry gives only 247 N with an
illustrative polymer modulus of 2 GPa. Neither value is a tested capacity, but
the comparison explains why a thin printed replacement is a poor starting point.
For S355 material the steel Euler value exceeds the onset of yielding; it must
not be used as the link's actual compression capacity. Inelastic behavior and
the holes can govern earlier.

## Assembly consequences and remaining engineering

Per leg, the proposed arrangement needs a metal guide, a fixed hip clevis and a
knee clevis/lever positively attached to the lower leg. The two clevis plates
visible in the viewer are an allocation for one folded or machined U-shaped
part at each joint; bend radii and manufacture are not detailed. Across both
legs this means **six small metal component allocations**, two of which replace
the previously printed guides. No extra moving link or motor is introduced.
Procurement cost, washers, bushings, mounting fasteners and final printed-piece
count are not established. Most of the body and leg enclosure can remain printed.

The fixed clevis must attach to a structural hip carrier, not just the thin
outer shell. The knee clevis needs a positive torque connection to the lower
leg. This load path, pin bending, joint wear and the printed carrier are the
next design work. A bare pin cantilevered from one thin wall is not the proposed
load support.

The viewer is an isolated mechanism drawing in 3D. It shows the analysed guide,
lever and spring layout, illustrative clevises, and a proposed outer envelope.
The enclosure panels are deliberately labelled as envelopes: pivot openings,
spring-post slits, overlap at the fixed hip carrier, closure and seals have not
been detailed. Full-body, wheel-pod and bracket collision checks, spring capture,
hard stops, landing strength and a new MuJoCo model remain to be completed before
replacing the main robot CAD or claiming a working jump.

Reproduce: `.venv-sim/bin/python design/concept06/internal_knee.py`.
Results: `output/internal-knee/study.json`.
