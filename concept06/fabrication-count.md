# Enclosed concept 06: purchasing and print-count estimate

There are 18 exported printed parts: 16 rigid parts and two TPU panels. A bounding-box layout fits them on six A1 mini plates, assuming one rigid filament/color. Budget seven or eight print jobs until orientations, supports, brims and material choices are sliced. This is a packing estimate, not a manufacturing release or a proven minimum.

## Purchased components

Allow roughly 40–45 main purchased components or assemblies, plus screws, inserts, washers, clips, wiring and connectors. This is a planning allowance, not a complete shopping list. Assemblies such as motors and encoder kits count once; their internal pieces are not counted separately.

| Group | Planning quantity | Basis |
|---|---:|---|
| Motors | 4 | Two SunnySky hip motors and two Waveshare wheel motors; selected |
| Compression springs | 2 | SWF12-50; selected |
| Tires | 2 | Nominal 100 mm; SKU unselected |
| Metal pinions | 4 | Two per hip; interfaces and procurement unfinished |
| Hip and intermediate shafts | 4 | Two hip shafts plus two intermediate shafts; retention unfinished |
| Linkage pins | 6 | Knee, coupler/guide and fixed guide pivot per side |
| Bearings | Approximately 8 | Four modeled hip bearings plus allowance for two supports per intermediate shaft; support design unfinished |
| Spring-guide/retainer assemblies | 2 | Hardware and detailed part count unfinished |
| Rotor encoder kits, including magnets | 2 | Packaging allocations; selection unfinished |
| Hip FOC drivers | 2 | One per hip; qualification and packaging unfinished |
| Dual wheel-driver board | 1 | Assumes one dual-channel board; unselected |
| Controller and IMU | 2 | Counted separately; could be combined |
| Battery and DC regulator | 2 | One each; unselected |
| **Planning subtotal** | **Approximately 41** | Excludes fastening stock, wiring, connectors, switches/fuses, optional optics/lighting and a charger |

Only the four motors and two springs currently have selected purchasing models. The viewer's electronics blocks and visor/light allocations are not a finished electronics BOM. Additional bearing, bushing, cooling or retention requirements could raise this allowance.

## Six-plate packing estimate

The layout uses a 170 × 170 mm working area inside the 180 × 180 mm plate, with at least 4 mm between rectangular part envelopes. Parts whose thickness runs along CAD Y are laid flat for the estimate. Support suitability, strength-oriented printing and brim footprints have not been qualified.

| Plate | Parts | Count |
|---|---|---:|
| 1 — rigid | Upper body shell, both wheel-motor service lids | 3 |
| 2 — rigid | Lower body tray, both 48-tooth gears | 3 |
| 3 — rigid | Both lower-leg/motor housings, one guide link | 3 |
| 4 — rigid | One thigh housing, both wheel rims, other guide link | 4 |
| 5 — rigid | Other thigh housing, both 60-tooth gears | 3 |
| 6 — TPU | Both compact spring-pocket service panels | 2 |
| **Total** | **Five rigid plates and one TPU plate** | **18** |

The slimmer thighs reduce the TPU panels enough to put both on one plate; the previous broad version required two TPU plates in this layout. The printed-part count stays at 18.

The largest individual exported axis is 169.54 mm. The [machine-readable layout](output/exterior/plate-layout-estimate.json) records orientations and placements; coordinates start at the corner of the 170 mm working area, so offset them by 5 mm on the actual plate. Different rigid materials/colors, large brims or changed orientations may require additional plates. No print-time estimate has been made without slicing.

Regenerate and check the envelope plan with `python3 design/concept06/pack_exterior.py`. It checks every part, all working-area bounds and at least 4 mm separation. It does not choose or validate slicer supports.
