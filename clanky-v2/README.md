# Clanky V2 — reference-led redesign in progress

The prior wheel work is committed locally as `37fc29e`. Its verified jump remains
at http://localhost:8765/viewer/wheel.html?scene=robot&motion=jump .

The current integrated assembly is at http://localhost:8765/viewer/v2.html . Its
default jump uses the 340-part detailed CAD and a 2.608 kg estimated mass:
264–265 mm wheel clearance, with a settled landing at both tested timesteps.
The dropdown also offers standing balance, programmed 15° cross-slope driving,
experimental flip recordings and manual poses with shared and individual leg
sliders. Exterior, Cutaway and Physics follow the same recording. Earlier
learned/recovery recordings retain their original CAD and do not qualify this
new plant. See [detailed dynamics and limits](detail-native/README.md).
Flexible wiring, cooling, print tolerances and structural loads remain open.
**This is development CAD and nominal simulation, not a verified robot.**
The latest navigation/viewer changes are local and have not been pushed.

The preceding [terrain-trained actor](training/TERRAIN_DRIVING.md) adds a local
**Learned terrain · +10° cross slope** replay. It improves the fixed terrain
screen from 2/13 to 5/13 paired passes; rocks/longitudinal slopes and a flat-stop
regression remain open. The original flat-driving actor remains separate.

The new [detailed-CAD navigation campaign](detail-native/terrain-navigation/README.md)
passes its programmed flat, +10° hill and +15° cross-slope demonstrations at
both timesteps. One new imitation fit passes 8/10 held-out physical evaluations:
flat, ±5° and +9°. The −9° valley pair stays upright but falls short of the
distance target. The **Learned hills · latest CAD** viewer mode displays the
passed +9° run. Its external navigator still uses perfect simulator pose.

## Preceding native dynamics development — 2026-09-09 UTC

A [native V2 plant](native/README.md) follows the preceding viewer composition,
including the aligned springs and the more detailed left hip. Its CAD and
component-prior estimate is 2.489 kg, including 0.805 kg of prints; these are
unweighed, unsliced values. The first 289 independent-pose, spring-energy and
two-timestep passive checks pass. Powered trials keep their own reports and
do not transfer the earlier R2 jump evidence. The integrated RS05 remains a
separate proposal, not the drive used in this native baseline.

The displayed jump now clears 264.31 mm at 0.25 ms and 264.25 mm at 0.125 ms
physics timesteps, with 195 mm COM rise and a settled landing over the last two
seconds of each eight-second trial. A preparatory lean, revised launch braking,
leg tuck and earlier landing preparation achieve this on the unchanged plant.
The first 81 mm viewer experiment is preserved at commit `6d3f645`.

This meets the **nominal** 250 mm jump target, but the sensitivity grid passes
only four of ten cases: nominal and higher-guide-friction cases at both
timesteps. A ±20% mass change or a 9.6 V supply fails the height and/or landing
checks. The full jump requirement remains incomplete. See `native/README.md`
and `native/jump-validation.json`; no hardware or other-skill qualification follows.

## Current body and wiring update — 2026-09-08

The user requested a single body with a flush sensor region, room for the battery
and Raspberry Pi, and a **loose D435i-sized camera fit**. `body_package.py` replaces
the former neck/eye pod with two body prints. The camera's native optical face is
exposed through an opaque surround; no extra tinted optical window is specified.

| Reservation | X × Y × Z, mm | Basis |
|---|---:|---|
| Camera and side USB | 45 × 120 × 40 | [D435i: 90 wide × 25 deep × 25 high](https://www.realsenseai.com/products/depth-camera-d435i/) |
| Pi, cooler and plugs | 110 × 78 × 32 | [Pi 5: 85 × 56 PCB](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-mechanical-drawing.pdf), approximate cooling/connector envelope |
| Battery | 76 × 42 × 32 | Retained 68 × 34 × 26 pack placeholder, SKU/discharge capacity unselected |
| Control electronics | 70 × 42 × 24 | Allocation, drivers not selected |

The side USB allowance is separately modeled as 25 × 20 × 20 mm inside the
camera reservation. This does not select a cable or prove its bend radius. Exact
mounting, Pi cooling/airflow, camera field of view and weather sealing remain open.
`check_body_package.py` checks exact CAD cavity containment, pairwise separation
of all four reservations, and the component envelopes within their own bay.

**Width tradeoff:** the 168 × 126 × 84 mm body is substantially wider than the
previous 66 mm body. Each complete leg/module moves 36 mm outboard relative to
commit `5c43860`, retaining its internal stack and all joint ranges. Track becomes
232 mm; the complete envelope is 252 mm wide. The approximately
199 × 252 × 166 mm fold **does not meet the former 180 mm working width target**.
This is a roomy packaging iteration, not a claim that the original size is retained.
All sixteen current connected prints still fit the A1 Mini's dimensional envelope;
orientation, support, plate count and strength are not yet qualified.
Printed volume is 542.3 cm³ versus 422.8 cm³ at the compact checkpoint. This is
volume, not a measured print weight or complete-robot mass.

`wiring_package.py` adds two integral passages in each thigh (6 mm power and
4 mm feedback bores), a 12 × 3.5 mm flat-harness passage in each shin, a 6 mm
motor lead exit and a 5.2 mm encoder-cap exit. There are **no extra printed covers**.
Feed unterminated wires through the shin passage before fitting connectors.
Wire gauge, insulation, current heating, grommets, strain relief and waterproofing
are not selected. The orange/blue viewer curves are **route sketches**: their
lengths vary with pose and they are not validated flexible cables. Do not treat
the rigid assembly collision pass as a cable-pinch or flex-life result.

Keep one rotor position sensor at each BLDC wheel motor, inside its encoder cap.
It supports low-speed/zero-speed torque control and wheel-speed estimation via
the gear ratio. An additional wheel-output encoder is not included at this stage;
gear backlash remains an estimation/control limitation. The encoder board shown
is still an allocation, not a sourced functional electronics design.

Rebuild/check in this order (CAD uses the project CadQuery environment; collision
and mesh checks use trimesh/python-fcl):

```text
.venv/bin/python design/clanky-v2/assembly.py
.venv/bin/python design/clanky-v2/check_body_package.py
python design/clanky-v2/check_wiring_package.py
python design/clanky-v2/check_assembly.py
python design/clanky-v2/assembly_properties.py
```

The new passage material has its own all-part/rotation-envelope check, including
inside each wheel module. Previously checked nominal wheel/bearing interfaces
are retained; the new wire ports remove material. Strength and fatigue need a
fresh review. Hip drives, grounded tie support, joint retention and final mass
remain unfinished. No R2 jump or learned-skill evidence transfers to this revision.
The first duct union produced two nonmanifold edges at a bore tangent to the
original thigh wall. Moving the bore plane 0.5 mm removes that zero-thickness
junction in the CAD; no mesh holes were filled. The initial failure is preserved
in `assembly-properties-before-wire-junction-fix.json`. The corrected 175 meshes
are watertight and consistently wound, with maximum volume error about 0.206%.

## Requirements and current direction

The latest [output-joint and case study](hip-output/README.md) is visible at
http://localhost:8765/viewer/v2.html?study=output&view=cutaway . The stock drive
now runs 15→60 then 20→80 teeth, retaining 16:1 and the same four gear purchases.
The earlier large intermediate gear interfered with the output spindle and
neck. The corrected layout clears the moving legs over 405 sampled poses;
the changed left joint/case has 987 passing exact material checks. Actual gear
engagement remains excluded and unvalidated. The case and bearing supports
are integral to the existing body prints; all three changed prints have CAD
bounds below 180 mm per axis. This is not a sliced plate or strength result.

Next work remains substantial: functional motor and compound couplings,
gear phase/backlash, bearing/shaft retention, case closure and tool access,
bilateral integration, loads, sourced electronics, measured mass/inertia and
motion qualification of the new native V2 plant. Required dynamic skills are
still unverified. The
[integrated-actuator comparison](integrated-hip/README.md) now includes official
RS05 CAD, the loaded 48 V curve and a lower-voltage EduLite sizing estimate.
At 48 V the prescribed 250 mm ballistic COM-rise load fits the RS05 curve at
2.2/2.64 kg, but that is not a wheel-clearance jump or battery-range validation.
The existing fixed spindle cannot pass through the RS05; an inboard tie route
clears a proposed neck envelope in 405 planar samples. Its anchor, moved knee
lever, full mounting structure and power system remain unfinished. Neither
integrated actuator is selected, and the custom drive remains the fallback.

The separate [supported-hip study](hip-joint/README.md) develops a left spindle,
paired bearings and retained hidden tie pivot without modifying the main viewer.
Its contact and exact-CAD diagnostics are separate from the current assembly
checks. It also exposes previously omitted lateral spring-slider loads; a
physical anti-rotation/retention interface is required before adoption. There is
still no complete V2 drive or dynamic motion result.

The subsequent [aligned-spring study](coaxial-spring/README.md) replaces the
eccentric stem with a curved steel link and directly guided printed piston.
Its optional local viewer is http://localhost:8765/viewer/v2.html?study=spring .
The left-side study passes 405 sampled poses with 896 exact-CAD follow-up checks
and finite piston support/anti-rotation probes. It keeps 16 connected prints;
complete spring retention, tribology, fastener loads and the hip drive remain
unqualified. This is separate development geometry, not a new motion replay.

`requirements.json` retains the full objective: Beni-like enclosed construction,
folding, big jumps, fall recovery, speed, one-wheel balance, off-road suspension,
low cost, mostly A1 Mini printable parts, low assembly complexity and sim2real.
Four locomotion motors remain preferred. Six is a fallback to be justified by
comparative required-motion evidence, not a response to one failed controller.
The numeric targets are labeled as working engineering targets where the user
has not specified an exact acceptance value.

All 15 supplied images were reviewed again. `reference-sheet.jpg` is a contact
sheet; originals in `ref/` remain unchanged. In particular:

- `IMG_3967–3969` show the outer-leg belt and its root-mounted motor.
- `IMG_3970` and `IMG_3973` show a second root motor and the knee mechanism;
  the embedded caption explicitly identifies an inner brushless knee motor.
- `IMG_3974` shows an internal reduction lever. The spring cylinder is behind
  the thigh in `IMG_3970/3973`.
- `IMG_3972` identifies metal thigh structure. White covers are not evidence
  that all the load-bearing parts are plastic.
- The assembled side/folded/airborne images guide proportions and packaging;
  perspective photographs do not supply calibrated dimensions or joint limits.

The references support approximately six locomotion motors on Beni, excluding
the head. This is a teardown inference, not its complete manufacturer inventory.
Mondo lists [215 ×180 ×180 mm and 1.75 kg](https://mondorobotics.com/), without
identifying the dimensioned posture. We use that envelope as a folded-package
working target. The latest requested sensor packaging uses a flush body opening,
with no separate head. It exceeds that working width target as stated above.

[Ascento](https://arxiv.org/html/2005.11435v1) establishes four-motor spring-assisted
jumping, but excludes side-rest recovery in its original controller.
[STRIDE V2's designer](https://www.alex-hattori.com/blog/wheeled-biped-v2) explains
why independently controlling reach and extension helped recovery, with added
cost and complexity. Neither reference establishes our proposed performance.

## Architecture search completed so far

The previous recovery redesign retained the 64.5/119.1 mm links. This study
also changes link lengths and the knee phase. It keeps all failures and separates
geometric travel from jump height.

1. `geometry-screen.json`: 30,000 broad-swing four-bars; the best combined
   near-vertical stroke/fold/reach candidate yielded about 52 mm stroke.
2. `partial-geometry-screen.json`: another 30,000 geometries allowing limited
   connected crank travel. Full rotation is not a user requirement. The best
   folding and recovery-reach candidate yielded about 131 mm stroke.
3. `refined-geometry.json`: 12,000 local samples around promising candidates,
   retaining a knee lever of at least 14 mm and adding a preliminary force
   screen. It found 165 accepted sampled intervals. The selected layout has
   **153.1 mm nearly vertical travel** while preserving fore/aft and above-hip
   reach. These are finite searches, not optimality or impossibility proofs.

An equal-link, internally belted 2:1 knee constraint was also calculated: it
provides about 179 mm vertical travel with 100 mm links, but zero fore/aft wheel
reach relative to the hip. It remains a comparison, not the selected mechanism.

Selected four-bar dimensions (mm): upper 104.229, lower 112.832, tie 98.197,
knee lever 14.501, fixed inner pin (11.613, 14.059), lever phase 2.72761 rad.
The sampled connected branch spans hip −2.8…+1.08 rad; the jump-alignment segment
uses −0.38…+1.03 rad. Axle X stays within 8.5 mm of a +15 mm line in that segment.
The actual complete COM has not yet been aligned with that line.

The force screen uses a **2.2 kg mass allowance**, equal vertical support and
constant acceleration over the whole stroke to an assumed 250 mm COM ballistic
rise. It estimates up to 3.73 Nm hip torque and 209 N tie force, with about
1.55 J released by the spring pair. The spring geometry allocates 65/20 mm seats
from the knee and a 64 mm free pin span for a 50 mm spring and end fittings.
These results omit link inertia/gravity, actual motor torque-speed, pitch,
contact dynamics and landing impacts. They do not demonstrate a 250 mm jump or
qualify any component. A tiny printed tie/lever cannot be assumed adequate just
because the kinematics close.

## Revised interfaces and internal spring

`layout.py` now includes paired **626 (6 ×19 ×6 mm) knee-bearing envelopes**,
a 6 mm steel shaft with local flats, separate axial layers for the steel knee
lever and tie, and an outboard wheel service lid. The lid/frame overlap and
inboard cap interference in the first layout are removed. Bearing dimensions
are nominal allocations; a supplier, fits, retention and ratings remain open.
The guide's steel stem is 6 ×3 mm with 8 mm end eyes. A round bore alone is no
longer the proposed knee torque interface, but the flats still require a
retained, load-qualified connection to the printed shin.

`compare_spring_paths.py` records the earlier strut envelope overlapping the
inner knee bearing at three of 41 sampled poses (up to 3.93 mm³). It caps the
spring at its free length and excludes the new guide blocks from the comparison.
This is a coil-envelope conflict, not a measured helix contact. The new
`spring_cartridge.py` keeps the selected **MISUMI SWF12-50** spring lengthwise
inside the thigh. The same knee lever gains a 14 mm spring crank. A passive
40 mm connecting rod moves a printed spring seat along a steel guide. Guide
supports and the fixed spring seat are integrated into the thigh print. This
adds one small printed slider and one passive steel link per leg, with no
additional actuator. End retention and the actual pivot screws/bushings are
still missing; the spring must remain captive when the moving seat is unloaded.

The kinematic spring check uses 1,201 hip positions and the spring's specified
50 mm free length / 5.5 N/mm rate:

- Maximum compression: **19.65 mm**, within the 20 mm design limit.
- Peak spring force: **108 N**; connecting-rod force: **113 N**.
- Peak transverse slider load: **34.8 N**. Friction cannot be ignored in the
  eventual actuator/energy model.
- Ideal spring-pair energy released through the selected stance: **2.09 J**.
- The earlier constant-acceleration, 2.2 kg load allowance gives about **3.74 Nm
  peak hip torque** and **209 N tie force** with this spring path. These are
  still a preliminary load screen, not a predicted jump.

A simple steel-beam guide screen (E =200 GPa; support centres 0.5 and 11 mm,
side load applied at the moving seat) gives 230 MPa /0.41 mm for a 4 mm guide,
versus **118 MPa /0.17 mm for 5 mm**. The CAD uses 5 mm. These are ideal elastic
calculations, without stress concentrations, wear, bearing clearance, guide
compliance, fatigue or a selected shaft grade; they are not a strength pass.
The 5 mm guide also needs its clearance checked against the spring's 6.5 mm ID
under manufacturing variation and load.

## Earlier linkage-only CAD and clearance evidence

The revised fold measures approximately **194 ×180 ×170 mm**, including the
fixed camera and allocated wheel drives. There are **fourteen connected prints**:
the previous twelve body/link/lid/wheel pieces plus two small spring sliders.
All fit within an A1 Mini bounding envelope. This is not a sliced plate count.

`check_interfaces.py` checks intended bearing seats/journals, the body seam,
and spring end seats with exact CAD intersections. All **39 checks pass with
zero overlapping volume**. It caught and prompted removal of a 1 mm protrusion
on the first slider that intersected the spring. An unloaded spring is allowed
to leave a gap to the moving seat; it is not stretched to bridge that gap.

`check_layout.py` uses 841 independent-leg combinations and a further 401-point
symmetric sweep. It includes conservative spring annuli and filled tire rotation
envelopes, so spring windings and wheel angular phase cannot hide an overlap.
The **1,242 sampled poses pass** for the modeled parts. Intended surface contacts
are excluded only after the exact-CAD check and input hashes match. The original
failed 289-case audit remains archived as `layout-fit-initial.json` from commit
`f5b4503`; `layout-fit.json` is the current result.

This is **not complete-robot fit validation**. The nominal leg drive volume has
shrunk to Ø48 ×14.5 mm once actual wall clearance and the outboard cover are
reserved. It does **not** fit the selected V2806 motor plus reduction, shaft
support and encoder. Hip motors/reductions, the grounded tie-pin support, pivot
hardware, fasteners, spring/shaft retainers, electronics and wiring still need
installation and checking. Those missing pieces must not be treated as fitting
just because the shown parts no longer intersect. `complete_robot_fit_pass`,
`mechanical_fit_pass`, `dynamics_validated` and `hardware_release` remain false.

The 120 ×20 mm dished wheel uses a 160 mm centre track. It is a different part
from the R2 wheel in the existing verified jump. No motion evidence transfers.
The viewer's Cutaway shows the new spring route and slider at each actual leg
pose; the old R2 viewer retains its original spring and programmed recording.

## Cost evidence

`motor-prices.json` records current manufacturer product/variant API prices on
2026-09-08, excluding tax and shipping. Existing X2216 880KV hips remain $24.99
each; V2806 650KV wheels remain $28.99 each. The motor-only four-drive baseline
is therefore $107.96. Two more X2216 motors would add $49.98 **before** drivers,
encoders, transmissions, bearings and mounts. Nothing is purchased.

A flatter V3508 family is listed at $42.99 each, but is only a screening option.
Its 380-labeled winding table also lists Motor Kv 350; that discrepancy needs
resolution before using it for sizing. Propeller-cooled current ratings do not
establish sealed-joint duty. Keep the existing motor pair unless packaging and
loaded torque-speed comparisons justify the extra $28 per pair. A lower ratio
alone can remove needed launch torque.

Sources: [X2216](https://sunnyskyusa.com/products/sunnysky-x2216-v3-brushless-motors-long-shaft-version),
[V2806](https://sunnyskyusa.com/products/sunnysky-v2806-motor),
[V3508](https://sunnyskyusa.com/products/sunnysky-v3508-motor).

## Wheel drivetrain packaging work

`wheel-drive-study.md` records the dimensioned V3508 direct-drive comparison and
the offset V2806 geared-drive search. The direct candidate includes the source
motor's shaft projections, shallow mounting threads, a one-piece tire and
compression limiters. It fails the 180 mm package target in the tested layout
and has substantially greater estimated winding loss at the same crawl torque.
It has **not** replaced the V2 drive selection.

The detailed component study places the existing geared motor 30 mm beside the
wheel axis in the shin's X/Z plane. It now includes stock gear hubs, two flanged
bearings, shaft and torque plate, a metal motor adapter and mounting plate, and
an integrated printed shin/case. Its 120 ×20 mm TPU wheel remains one connected
print. The wheel, structural case and two service covers total four prints per
module; the complete purchase and machining cost remains open.

Inspect it at http://localhost:8765/viewer/v2-wheel.html using Cutaway, exploded
assembly and prescribed gear rotation. [The component notes](geared-wheel/README.md)
record the sources, assembly sequence, nominal collision/rotation/insertion
checks, preliminary loads and remaining printing/strength work. The 205-pose
screen uses a 3 mm inboard leg shift and body narrowing to 66 mm. The module is
now integrated into the assembly described below. It has not been adopted into
a native V2 plant or validated in a jump.

## Previous wheel/linkage integration checkpoint (`5c43860`)

The measurements in this section describe the committed compact assembly before
the requested D435i/body/wiring update. The current `assembly.*` exports have been
regenerated; use the body update above and the matching JSON reports for current
dimensions and checks.

`assembly.py` generates actual CAD for both detailed wheel modules, shifts the
retained leg internals 3 mm inboard and narrows the body laterally by 66/72.
`assembly.step`, `assembly.json` and `assembly-parts.json` were that viewer's
assets; the older `layout.*` files remain the linkage-only source checkpoint.
The spring centre moves with the leg, so the viewer and collision check use the
same 44 mm lateral spring position.

The shown assembly has **16 connected prints and 170 CAD solids**. Motor internal
pieces and each fastener are separate solids; 170 is not a purchase count. The
extra rear motor/sensor cover adds one print per leg compared with the earlier
14-print layout. Printed volume is about 422.8 cm³, down from 437.0 cm³ before
integration. All shown prints fit an A1 Mini bounding envelope, but orientation,
support, actual plates and missing mounting parts remain to be resolved.
The folded bounds remain approximately **194 ×180 ×170 mm**.

`check_assembly.py` passes retained-part mutual clearance and both complete wheel
modules over 841 independent-leg combinations and a 401-pose symmetric sweep.
The module compounds use conservative rotation envelopes externally; their
internal nominal mating and rotation evidence is inherited only after checking
source and asset hashes. No camera geometry is silently excluded. Previously
checked bearing/seat contacts remain valid under their shared translation; the
body seam shares the same affine scale. This remains a finite nominal check of
the modeled assembly, not complete robot fit or a tolerance pass.

`assembly_properties.py` verifies mesh topology and geometric properties before
any mass assignment. Finer body tessellation and removal of four zero-area
camera-pole triangles fix the initial export failures, preserved in
`assembly-properties-before-export-fix.json`. No surfaces are filled to hide a
hole. All 170 current meshes are watertight and consistently wound, with volume
error below 1% relative to exact CAD (body parts below 0.307%). Unit-density
inertias are saved for later material and purchased-component mass assignment.
Complete robot mass is still unknown while hip drives and electronics are missing.

## Hip support and drive sizing

`hip_support.py` and `check_hip_support.py` investigate the fixed end of the
internal tie. Four of five axial bracket planes interfere with the spring,
thigh or tie. A 3 mm metal bracket at Y=54…57 mm clears 405 sampled poses, with
only 0.5 mm nominal clearance. An ordinary inward-facing button-head pivot
hits the spring guide during folding. `hip-tie-anchor-fit.json` retains that
failure; the bracket and fastener are **not** installed in the accepted assembly.
A complete fixed spindle, hip bearing arrangement, smooth retained pivot and
output transmission are still needed. Simply bolting the tie to the rotating
thigh would change the mechanism and is not an acceptable substitute.

`hip_drive_screen.py` adds a prescribed one-dimensional launch sizing check.
It uses the actual linkage/spring path and a 250 mm ballistic COM-rise allowance,
but omits link/gear inertia, contact and body rotation. At the retained X2216
880KV motor's assumed 32 A limit, 12:1 fails this profile; 16:1 requires about
23.8 A nominal and 29.3 A at 20% greater mass. Ratios 20:1 and 24:1 also clear
this limited calculation. No ratio or new hip gearbox is thereby adopted.
An independent work/energy balance includes motor rotor acceleration and checks
the torque calculation; it does not establish a jump or adequate thermal duty.

The [short-shaft motor source](https://sunnyskyusa.com/products/sunnysky-x2216)
and its drawing are archived under `hardware-references/`. The source confirms
the selected short-shaft SKU at $24.99 on 2026-09-08, the 27.7 ×34 mm body,
3.175 mm shaft, three M2 rotor holes on Ø12 and 2.8 mm mounting-thread depths.
This resolves the earlier price record's long-shaft listing without borrowing
the V2806 wheel motor's different rotor mounting pattern. Prices exclude
shipping/tax; sealed-joint duty and driver conventions remain unqualified.

## Remaining work toward the full objective

1. Complete the hip drivetrains, grounded tie-pin supports, spring and shaft
   retention, pivot hardware and fastening. Qualify the integrated wheel drives,
   printed guide supports and positive knee torque connection, with tool access
   and load paths.
2. Verify independent leg motion, spring travel, storage folding and assembly
   sequence with all hardware installed. Derive true CAD masses/inertias.
3. Build a separate free-body native MuJoCo plant with those exact masses,
   collision geometry, spring routing, limits, rotor inertia and electrical
   assumptions. Adapt controllers to this linkage's actual branch; existing
   recovery helpers hardcode old hip and knee ranges and must not be reused
   blindly. Optimize takeoff/tuck/landing and test at both timesteps.
4. Evaluate the full fall-family bank, speed/stop, uneven terrain and dynamic
   one-wheel transition/hold/disturbance rejection. Two-wheel differential
   extension and static COM alignment do not prove single-wheel roll control.
5. Compare independently powered knees only where measured four-motor deficits
   remain. Include the complete extra drive mass, coupling and cost; six planar
   motors alone do not guarantee lateral one-wheel stability.
6. Complete sourced BOM, printable part and plate plan, structural/landing
   calculations, motor/spring identification plan, policy interfaces and sim2real
   validation. Physical material/traction/fatigue tests remain an explicit limit.

The goal is still open. This checkpoint does not meet the full required motion
set or constitute a finished robot design.

To reproduce the integrated assembly and its checks after the earlier linkage
and detailed wheel sources are present:

```sh
.venv/bin/python design/clanky-v2/assembly.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_assembly.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with rtree python design/clanky-v2/assembly_properties.py
.venv/bin/python design/clanky-v2/hip_drive_screen.py
.venv/bin/python design/clanky-v2/hip_support.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_hip_support.py
```

## Reproduce the earlier geometry checkpoint

```sh
.venv/bin/python design/clanky-v2/geometry_screen.py
.venv/bin/python design/clanky-v2/partial_geometry_screen.py
.venv/bin/python design/clanky-v2/refine_geometry.py
.venv/bin/python design/clanky-v2/spring_cartridge.py
.venv/bin/python design/clanky-v2/layout.py
.venv/bin/python design/clanky-v2/check_interfaces.py
uv run --no-project --python /usr/local/bin/python3.11 --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_layout.py
```

`tests/test_v2_geometry.py` compares the selected mechanism with the established
independent solver over 1,201 angles, checks closure and branch continuity, and
checks exported folded bounds and explicit unqualified status. Browser checks
cover loading, Fold/Ride, Cutaway and the manual controls. These checks prove
only their stated geometry/viewer scope.

`tests/test_v2_cartridge.py` checks the slider closure, unilateral spring force,
travel limit and force/energy consistency. Four Python geometry/cartridge tests
and five existing JavaScript CAD/replay tests pass. These do not establish the
required dynamic skills or physical durability.
