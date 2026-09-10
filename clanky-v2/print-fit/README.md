# Print fits and tolerances

The current CAD has nominal assembly gaps, **not a calibrated A1 Mini print
profile**. Do not print the full robot expecting every bearing, gear and joint
to fit. The small samples below are ready for slicing and physical fit testing;
their meshes and bed bounds are checked separately. No hardware fit is certified.

For example, the new Ø13.02 mm housing around a Ø13 mm bearing has only 0.02 mm
total diameter clearance (0.01 mm per side). The hip and wheel seats use similarly
small nominal gaps; the knee seats are nominal Ø19 against Ø19 bearings. These
are unfinished fit targets, not a claim of 0.01 mm printer accuracy.

Printer compensation and assembly clearance serve different purposes:

- **Assembly clearance** is the desired space between finished parts.
- **Print compensation** corrects the measured difference between CAD and a
  particular filament, orientation and slicer profile. It can differ between
  holes and outside contours. It must not be applied to purchased metal parts.
- **Manufacturing tolerance** is the allowed variation around the finished
  dimension. A nominal collision-free CAD model does not establish that range.

Prusa's [design guidance](https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135)
likewise recommends clearance and iterative testing because material and print
settings affect fit. Its printer accuracy statements are not an A1 Mini spec.
The A1 Mini's [180 × 180 × 180 mm build volume](https://us.store.bambulab.com/products/a1-mini)
is an envelope, not a dimensional accuracy guarantee.

## Fit samples

All dimensions below and all labels on the samples are **CAD dimensions in mm**.
Rigid and TPU materials require separate prints. These optional calibration
plates are not additional robot components or a final robot plate count.

| File | Features | Use |
|---|---|---|
| `rigid-fit-plate.stl` | Ø13/15/16/19 bearing holes, each +0.0..+0.5 in diameter; M3 holes/nut pockets; 4 × 7 tab and slots | Start here with the intended rigid filament. Seven separate connected samples, arranged within 148 × 169 mm. |
| `horizontal-bearing-plate.stl` | Same four bearing ladders with horizontal hole axes and integral feet | Compare against vertical holes when choosing body/thigh orientation. Match final support settings. |
| `M2p5-fasteners.stl` | Ø2.5..3.0 holes and 5.0..5.5 AF pockets | Pi screws and captive nuts. |
| `TPU-hub-fit-plate.stl` | Six representative 3 mm hub webs; three Ø5.0..5.5 sleeve holes on Ø34 PCD | Fit the Ø5 compression limiters in the actual wheel TPU. Does not test full-wheel stiffness. |

The bearing strips read Ø13, Ø15, Ø16, Ø19 from front to back in the arranged
plate, with diameters increasing left to right. The fastener strip's front row
contains screw holes, its back row nut pockets: labels +0.0..+0.5 add to Ø3 and
5.5 AF respectively (or Ø2.5 and 5 AF in the separate Pi sample). Nut pockets
have a small through-hole so a seated nut can be pushed out. Tab labels are
clearance **per side**, not total slot enlargement. The key is printed separately
on the same plate. Bearing mouths have 0.4 mm lead-ins; measure the straight land.

1. Use the final nozzle, filament, layer height, wall count and slicer settings.
   Keep scale at 100%. Record any existing hole/contour or elephant-foot
   compensation; do not unknowingly compensate in both CAD and the slicer.
2. Print only the relevant samples first. All layouts leave room for a 5 mm brim
   within 180 mm. Inspect the sliced preview, especially horizontal bore supports.
3. After cooling and cleaning supports, measure in two directions and at several
   depths. Repeat critical samples at least three times; record range as well as
   mean. Record actual bearing/sleeve/nut dimensions too. Calipers alone do not
   establish a 0.01 mm bearing fit; use suitable gauges or a measured trial assembly.
4. Check gentle insertion, rotation where required, and removal. Never force a
   bearing by pressing through its balls. A coupon fitting by hand does not qualify
   retention: a loaded bearing must not creep/spin in the housing or lose alignment.
5. Record results in a **copy** of `calibration.template.json`, with material and
   orientation. Positive bore compensation means enlarging CAD by that amount
   in **diameter**, not radius. For example, a Ø13.20 coupon measuring Ø13.00
   indicates about +0.20 correction for a desired Ø13.00 finished hole in that
   tested process. Choose the actual finished fit separately.
6. Apply only measured, interface-specific corrections to a new CAD revision;
   recheck remaining wall thickness, coaxiality, gear centers and full motion.
   Fit a complete housing before committing to a full robot print.

There is intentionally no universal +0.2 mm correction enabled. If a reliable
bearing fit cannot be obtained directly, provide controlled finishing allowance
and finish the coaxial seats together, or revise their retention/support. Do not
freehand enlarge each bearing independently: the gear axes must remain aligned.
Metal shafts, D-bores, bearing spacers and high-speed adapters require their own
specified machining fits; they are not rescued by changing printer settings.

## Stacks that still need measured limits

`audit.json` records ten present nominal interfaces and five **illustrative**
worst-case calculations. The error values are assumptions for sensitivity,
not measured printer performance or supplier tolerances. For example, two
faces each displaced by 0.15 mm can consume a nominal 0.2 mm tab gap. The
rotor screw's nominal 0.15 mm insertion margin can also disappear with screw
length and countersink variation; actual hardware/seat measurements are required.

Gearbox stack checks must include bearing widths, shaft shoulders, circlip
position within its groove, shim thicknesses and housing datums. Summing the two
visible clip gaps alone does not establish available shaft end float. Bearing
retention, selected running clearance and gear backlash remain unqualified.
Likewise, spring piston running clearance must account for both printed surfaces,
heat, wear and dirt. Enclosure seams need a complete-body warp check.

The one-piece 120 mm TPU wheel remains unchanged. Its metal sleeves limit clamp
compression; coupon fit does not prove wheel torque transfer, creep resistance,
jump strength or service life. Those need separate full-wheel tests.

Rebuild with `.venv/bin/python design/clanky-v2/print_fit_coupons.py` and
`.venv-sim/bin/python design/clanky-v2/print_fit_audit.py`. No robot geometry is
changed by these scripts, and the earlier simulation passes remain tied to their
original CAD. `hardware_release` stays false.
