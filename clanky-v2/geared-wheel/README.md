# Detailed V2 geared wheel module

Local component viewer:

http://localhost:8765/viewer/v2-wheel.html

This replaces the earlier face-only gearbox study with a dimensioned output
shaft, flanged bearings, wheel mounting and enclosed motor package. It is a
component development assembly, **not an adopted complete V2 plant or a jump
validation**. The R2 jump recording still belongs to the previous robot.

Both modules are now installed in `../assembly.step` and the main V2 viewer.
`../assembly-fit.json` checks that integrated development assembly across
independent leg positions; complete hip hardware and V2 dynamics remain open.

## Construction

- One 120 ×20 mm TPU wheel, with a 7.5 mm rear recess. Its hub now clears the
  fixed bearing tube radially by 2 mm; the three mounting holes move to a
  34 mm pitch circle to keep material around the holes. No separate printed rim.
- One structural shin/gear/motor case, one front bearing lid and one rear
  encoder/motor-mount cover. The module therefore has **four printed pieces**,
  including the wheel. The small rear cover also supports the sensor PCB.
- SunnySky V2806 650KV: source drawing confirms Ø35 ×18 mm, Ø4 shaft and 5.4 mm
  rear projection, 19/25 mm base screw spans and four M3 rotor holes on Ø12.
  The drawing does **not** establish usable thread depths or the front shaft
  projection. These remain explicit allocations to check against a motor sample.
- Stock steel gears: Belting Online **GRSSN05/20B** (4 mm bore, 4 mm face,
  9 mm overall) and **GRSS05/100B** (6 mm bore, 4 mm face, 8 mm overall).
  They give 5:1 reduction at 30 mm centres. The pair is listed at £24.10 ex VAT
  per wheel, checked 2026-09-08; tax, shipping and machining are extra. Their
  published general ±0.25 mm allowance requires an actual face/clearance check.
  No KHK torque rating is being assigned to these different gears.
- Two **SMB F696-2RS** sealed flanged bearings: 6 ×15 ×5 mm, Ø17 ×1.2 mm flange.
  The supplier sheet gives 52 kgf static and 134 kgf dynamic radial ratings.
  The opposed flanges locate in the printed bearing tube, with 0.15 mm nominal
  axial freedom. Measure bearing widths and shim the actual assembly; printed
  nominal dimensions do not establish correct preload or fit.
- A steel Ø6 shaft drives a custom 2 mm steel D-bore plate. The output gear
  uses a proposed Ø2 ×24 mm coiled cross-pin. Its holes must be matched in the
  gear and shaft; pin fit, shaft grade, impact and fatigue remain unqualified.
- Six **ServoCity 2807-0609-0500** 6/9 ×0.5 mm shims per module separate the
  bearing inner races and plate. A twelve-pack is listed at $2.49.
- Three **Harwin R30-6200314** Ø5/3.2 ×3 mm aluminum sleeves carry the wheel
  fastener clamping load through the TPU centre. M3 ×10 screws, metal washers
  and nuts attach the wheel to the plate. A central M3 ×8 retains the plate.
- The motor uses a custom metal flange/shaft adapter. Four flush M3 ×5
  countersunk screws allow a 2 mm motor front wall. Three shared rear screws
  hold the aluminum motor plate and printed rear cover to the case.

There are **four custom metal parts per module**: output shaft, wheel plate,
motor flange/shaft and motor mount plate, plus cross-drilling the bought gear.
Their machining prices are unknown. This route retains the inexpensive motor,
but is not yet proven the cheapest complete wheel drive. The CAD depicts motor
internals and each washer separately; its solid count is not a purchase count.
Encoder electronics, connectors, wire routing and seals are not a complete BOM.

## Assembly sequence to verify

1. Fit the rotor adapter and pinion to the motor. Bolt the motor onto its metal
   mounting plate outside the case; this provides access to the rear M3 screws.
2. Insert the motor/plate unit from the rear of the case. Fit the encoder board
   to the removable cover, install the rear-shaft magnet and close the cover
   with the three shared mounting screws. Confirm sensor gap and tool access.
3. Cross-pin the driven gear and output shaft outside the case. Assemble its
   rear shim, opposed bearing pair, centre shims and bearing lid, then install
   the group from the wheel side with the correct gear phase. Close the lid
   with its three M3 screws. Check tooth/hub clearance over a full revolution.
4. Assemble the TPU wheel, sleeves, washers, nuts and D-bore plate on the bench.
   Fit the front shaft shims, slide that wheel assembly onto the shaft and
   retain it with the central screw. Check end float and drag before loading it.

This is a reviewed sequence, not a completed physical assembly test. The motor
was changed to rear insertion because the first front-access arrangement could
trap its mounting ears. The motor unit and sensor cover each pass a 91-position
rear-insertion sweep at nominal dimensions. Output-group insertion, nut and tool
access, tightening, motor thread engagement and tolerance-corner checks remain
necessary. Removing the
wheel exposes the bearing-lid screws; the wheel must be removed first for service.

## Evidence and limits

`interfaces.json` checks every modeled pair using exact solid intersections;
the current 73-solid assembly has no overlapping volume.
The earlier screw/adapter/case failures are retained as `interfaces-first.json`
and `interfaces-second.json`. Contacts are reported separately from penetration.
Motor internals and the encoder are simplified envelopes.

`fit-screen.json` checks the module against the retained leg/body at 205 poses,
including full-length spring annuli and tire rotation envelopes. It explicitly
tests **3 mm inboard leg movement and lateral body scaling from 72 to 66 mm**;
these are packaging hypotheses, not edits to the accepted full-robot layout.
The retained parts' mutual fit and the complete independent-leg sweep must be
rechecked if this package is adopted. Its rotation check fills tire cells and
checks the gear, tire, fastener and motor envelopes against stationary parts.
All 205 leg poses, the listed rotation envelopes and the two rear-insertion
paths pass for the current asset hashes. The nearest retained-leg clearance is
only 0.425 mm at the sensor cover; wheel-fastener envelopes clear the lid screws
by 0.35 mm. These nominal gaps still need tolerance and deflection assessment.

`geometry-properties.json` finds all 73 meshes watertight and consistently wound,
with mesh volumes within 0.206% of the exact CAD. The exported tire is one
connected watertight component, flat within a 120 ×120 ×20 mm print envelope.
Its estimated mass is 89.6 g at an assumed TPU density of 1.2 g/cm³. This does
not establish an easy or support-free print: the front pocket leaves a roughly
10 mm radial overhang below the hub, so slicing/support review is still open.
Unit-density inertia tensors are exported for later material/component mass
assignment; the simplified motor and bearing envelopes cannot use bulk density.

`load-screen.json` is a static calculation under a 2.2 kg robot allowance,
not final mass or measured landing forces. Its one-wheel 5g normal /1g lateral
case reaches about 308 N radial bearing reaction and 182 MPa illustrative
shaft stress after an assumed factor of two for stress concentration. The
radial-only bearing rating/load ratio is about 1.66; simultaneous axial load,
fatigue and printed support stiffness are not covered by that ratio. There is
**no bearing or shaft strength pass**. Two tests check independent beam examples
and force/moment conservation, not material durability.

Still required: motor/source dimensional confirmation; actual CAD masses and
inertias; custom-part quotes; bearing fits and measured end float; gear mesh and
retention under reversals; printed support, wheel/plate and shaft impact/fatigue
tests; drive thermal identification; complete wiring and sealing; completion of
the integrated robot's hip hardware; then native V2 dynamics and the complete
required skill bank.

## Reproduce

```sh
.venv/bin/python design/clanky-v2/geared_wheel_module.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with python-fcl --with rtree python design/clanky-v2/check_geared_wheel.py
python3 design/clanky-v2/geared_wheel_loads.py
env OPENBLAS_NUM_THREADS=1 uv run --no-project --python /usr/local/bin/python3.11 \
  --with trimesh --with rtree python design/clanky-v2/geared_wheel_properties.py
```

Source URLs and hashes are in `manifest.json`; drawings are archived under
`../hardware-references/`. Nothing has been purchased, published or pushed.
