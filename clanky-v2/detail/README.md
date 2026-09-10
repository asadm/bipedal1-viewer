# Bilateral assembly detailing

This is work in progress, separate from the frozen native plant. The V2 viewer
now shows this CAD for Manual mode and the default programmed jump/balance.
These recordings use the new `detail-native/` plant. Older learned, recovery
and terrain recordings retain their source-matched preceding CAD and physics.

Added without increasing the 16 printed-part count: both output supports,
integral motor mounting plates/webs, four captive-nut enclosure closures, battery
strap bridges and locating rails, two D435i mounting webs and four Pi posts.
A metal rotor-face adapter resolves the selected
motor/pinion shaft-size mismatch; it is a custom part, not a purchase-ready SKU.
The motor source drawing is `../hardware-references/x2216-drawing.jpg`.

Checkpoint `c8ab841` retains the first failed revision: a cover tab clipped the
sensor surround, the adapter D-flat was 0.02 mm too large, and the motor cylinder
had no bolt holes or rotor-face/shaft detail. Those three issues are corrected.
The current 370-pose sweep passes topology for all 109 changed solids. 222 of
232 exact contact reprobes have no positive material overlap; no reported
pairs remain untested. The ten unresolved cases are six intersections of the
oversized Pi cooler allocation with the GPIO, USB-C and mounting screws, plus
four internal thread overlaps between supplier pinions and their set screws.
These remain reported failures. The allocation is not actual cooler material,
and the thread solids are supplier CAD; neither fit is qualified by this screen.

The preceding first-stage overlap was the 15T pinion's **hub**, because the
pinion faced the wrong way. The earlier incremental audit omitted the unchanged
left first-stage pair. `detail_gears.py` flips that pinion, sets the tooth phases
and gives each stage 0.1 mm extra centre separation (30.1 and 40.1 mm). Both
motor/compound axes move slightly inside the unchanged body envelope. The
custom D sections rotate with their pinions; mounting flange holes stay aligned.
Active tooth-face overlap is 5.5 mm in the first stage and 6 mm in the second.

The independent `detail-gear/exact-cycle.json` checks 73 samples per stage over
the common tooth cycle: **146/146 have zero material overlap**. A separate
121-sample section screen per case passes at nominal spacing, 0.05 mm less
spacing, and the tested positive spacing errors; removing the entire 0.1 mm
allowance causes overlap again. The approximate added circular backlash is
0.073 mm per stage. This is finite nominal geometry evidence, not measured
backlash, printer compensation, runout/tilt tolerance, gear strength or loaded
engagement qualification. Source thread overlaps are not silently waived.

## Compound torque path

`../detail_compound.py` replaces the intermediate hub/shaft reservations with a
custom one-piece steel shaft: D6 torque section, round Ø4 bearing journals,
Ø32 flange and a register for the stock 60T gear. Four M3×8 countersunk screws
use its inner hole pattern; four countersinks must be added to the purchased
gear. The gear moves 0.5 mm outboard. Its tooth profile is unchanged.

Two 624 (4 × 13 × 5 mm) bearing envelopes replace the 696 reservations. Their
smaller seats are integrated into the same body prints. Three sourced shim
allocations and two DIN471 clip envelopes complete the proposed axial retention.
The clip outlines are conservative swept envelopes, not detailed ear/gap solids.
This is a candidate machining/assembly layout, not a load-qualified gearbox or a
low-cost stock shaft. The sealed bearing variant, fits, fillets, flange/shaft
fatigue, locking, tool access and machining quote remain open.

The two visible clip gaps are nominally 0.05 mm each. The manifest's nominal
clip-gap totals do **not** establish free shaft travel: shoulders, pinion shims,
bearing locations and clip movement within grooves also constrain that travel.
Measure and calculate the complete stack before selecting shims or tightening.

The motor has separate fixed and rotating external envelopes, with the drawing's
M3/M2 mounting holes and 3.175 mm shaft. The axial split is bookkeeping, not
supplier internal geometry. Both pieces represent one purchased motor. The
adapter uses a nominal 5.97 mm round diameter and a 2.46 mm flat offset, and its
M2 screw heads sit 0.15 mm below the pinion seat. Machining fits, runout, material
and load qualification are still required.

## Camera and computer

The D435i rear holes are 45 mm apart, from the manufacturer's drawing on
datasheet page 142 (archived in `../hardware-references/camera`). Two M3×6
screws pass through 3.5 mm printed faces and enter the camera by 2.5 mm, below
the specified 3 mm maximum. The gussets are part of the lower tray; the camera
is installed with the cover off. The roomy 120 × 45 × 40 mm bay is retained.
The camera's housing/holes are a drawing-derived envelope, not the complete
SolidWorks housing/lens/connector geometry.

The Pi mounts to four integral upper-cover posts, using its 58 × 49 mm hole
pattern. M2.5×10 screws engage side-loaded DIN 934 metal nuts. Its components
face down, separating the cooler from the support posts. Major connector
envelopes come from Raspberry Pi's official STEP, retained under its MIT
license in `../hardware-references/pi5/supplier-cad.zip`; the viewer does not
pretend to render all 2,689 supplier solids. A conservative cooler allowance
remains amber and must be resolved against the actual cooler and plugs.
Install the Pi/nuts on the detached cover before closing the body. Board
thickness, component placement, tool access, ventilation and physical fits
still need qualification.

The two body prints have 168 × 129 × 73.5 mm (lower) and 168 × 129 × 70 mm
(upper) bounding boxes. These checks do not establish support-free printing,
plate orientation, tolerances or strength. The full assembly still contains
16 printed components.

## Printer tolerances

The [print-fit audit and samples](../print-fit/README.md) distinguish assembly
clearance, process compensation and allowed manufacturing variation. Ten
nominal interfaces are recorded; none is calibrated to a physical print yet.
The Ø13.02 compound seats, Ø16.02 hip seats, Ø15.02 wheel seats and nominal Ø19
knee seats must not be interpreted as directly printable precision fits.
Separate rigid and TPU coupons fit the A1 Mini envelope. Their source-bound
mesh checks include round-hole faceting; physical fitting, selective shimming,
gear alignment and loaded/thermal checks still remain.

Rebuild with `.venv/bin/python design/clanky-v2/detail_model.py`; run the mesh
diagnostic in `.venv-sim`, then exact contact reprobes in `.venv`. Update the
viewer wrapper using `scripts/cad/build_detail_viewer.py`. The original `v2.mjs`
and all prior plant/evidence sources remain unchanged.

Remaining completion gates are in `../CAD_COMPLETION.md`.
