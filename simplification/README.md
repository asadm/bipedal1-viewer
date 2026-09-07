# Rejected telescoping-leg study — retained for reference

**User decision: reject telescoping legs; retain Beni-style bending legs with springs inside the thighs.** This document records an abandoned investigation. Its 10–12-part target is not an active design requirement or a result for the bending-leg robot. Continue simplification from [the enclosed concept-06 design](../concept06/exterior.md). The old preview URL now redirects there.

The enclosed concept-06 work is committed as **`38727ed`**. The [current printable CAD](../concept06/exterior.md) still has 18 printed parts. This study explores a different mechanism; it does not silently replace that CAD or inherit its jump result.

The rejected candidate used two enclosed rack-driven telescoping legs, targeting 10 printed parts, or 12 with separate replaceable racks. The body shells would become the fixed guide/gearbox structure, and each moving leg would combine the wheel-motor housing, rack and sliding enclosure. Four motors and independent height control were retained in the proposal.

The obsolete architecture sketch was a schematic packaging preview, not exported manufacturing CAD; it omitted detailed interfaces, bearing seats, spring channels, fasteners and seals. No STL or STEP was supplied for this unqualified concept. [Open the active bending-leg viewer](http://192.168.86.226:8765/viewer/streamlined.html).

## What the current count really contains

The 18 current prints comprise 14 structural, transmission or wheel parts and four access panels. The thigh covers already replace the crank structures. Fusing everything in place would obstruct motor insertion, spring assembly, joint motion or servicing.

| Printed function | Current four-bar design | Rack-leg target |
|---|---:|---:|
| Structural body / fixed enclosure | 2 | 2, incorporating fixed leg guides |
| Upper legs, lower legs and passive guide links | 6 | 2 sliding leg/motor-housing units |
| Large transmission gears | 4 | 2 |
| Wheel-motor service caps | 2 | 2 |
| Moving-pin TPU panels | 2 | 0 |
| Wheel rims | 2 | 2 |
| **Total** | **18 exported prints** | **10 target prints** |

Separating each rack from its leg for wear replacement gives **12**, still six fewer than today. That option adds two attachment interfaces, so it should be chosen only if tooth tests justify it. The remaining motor service caps allow assembly and repair; they are not decorative shells. Decorative visor/light allocations are omitted from the proposed architecture.

The rack concept removes **six passive linkage pivots**, two shaft positions and the associated additional torque connections. It adds **two purchased linear-rail/carriage assemblies** and requires different springs. It therefore reduces assembly operations but does not eliminate purchased precision hardware. The final bought-part or screw count is not known yet.

## Proposed mechanism

Each SunnySky motor drives a 36-tooth printed gear through its 12-tooth metal pinion. A coaxial 12-tooth metal pinion drives a vertical module-1 rack. One linear rail/carriage supports side loads and prevents rotation; the rack is not the bearing surface. A compression spring in a guided channel acts in parallel with each leg.

- **3:1 reduction**, rather than the existing 20:1 rotary-hip reduction. Applying 20:1 directly to a small rack pinion would sacrifice extension speed.
- **100 mm independent vertical travel**, with no intended fore/aft wheel motion relative to the body.
- **Four existing motor models retained for sizing.** Motor mounting, tooth loads and current control remain to be detailed.
- **Nested fixed and moving structural surfaces provide the enclosure.** No cosmetic knee linkage, flexible moving-pin membrane or separate thigh fairing is required in this architecture. Sliding clearances and dirt exclusion remain engineering tasks.

The schematic allocates approximately 185 mm compact height, 285 mm extended height and 180 mm width. The proposed body-half envelope is 144 × 60 × 155 mm and each moving leg approximately 69 × 50 × 162 mm. These allocations fit inside an A1-mini-sized envelope, but no connected-solid, insertion-path, support, strength or plate-layout validation has been performed on them.

## The spring is the main unresolved component

**The current SWF12-50 cannot be reused directly across 100 mm of travel.** Its design working compression was 20 mm. Adding a pulley/cam mechanism solely to retain it would undermine this simplification.

The screening specification is a guided spring with roughly 150 mm free length, at most 11 mm OD, approximately 0.30 N/mm rate, 100 mm working compression and at most 45 mm solid height. These values define a desired component, not an available or qualified SKU. Fatigue stress, buckling, end seats, friction, price and sourcing are unresolved. The viewer's spring is just that envelope.

At these assumed values, each spring reaches 30 N at full compression; the pair stores 3 J. For an assumed 2.1 kg total mass, their combined force would equal weight around 66 mm extension. These are Hooke-law sizing calculations, not suspension or jumping validation.

The old $74.52 motors-and-springs subtotal does **not** apply to this architecture: spring selection and price must be reopened, and rails are additional hardware outside that old subtotal. No new order or price commitment is made.

## Guide and drive checks

The [HIWIN dimensional reference](https://www.hiwin.com/wp-content/uploads/Linear_Guideway-E.pdf) gives an MGN9H assembly 20 mm wide, 10 mm high, with a 39.9 mm carriage. A nominal 150 mm rail therefore leaves 10.1 mm beyond a 100 mm carriage-center stroke, approximately 5 mm at each end before stops. The sketch uses this envelope. Procurement is unselected; genuine HIWIN load ratings must not be assigned to an unspecified inexpensive rail.

The inherited DC-equivalent SunnySky model gives approximately 137 N per leg at low rack speed with a 32 A motor-current assumption and 80% efficiency. Its voltage-limited force drops at higher speed. The [generated calculation](output/study.json) includes the curve and an optimistic single-mass grounded-stroke calculation. It omits unsprung mass transfer, guide friction, backlash, tooth deflection and the takeoff transition. Its ballistic-energy equivalent is **not a predicted robot jump height**. Mechanical end-stop impact must not be used as the launch strategy.

The rack architecture still needs a new MuJoCo model and controller. The previous 178 mm replay cannot validate it. Sim2real may benefit from two prismatic leg coordinates instead of closed kinematic loops, but friction, stiction, rack backlash and guide alignment must be measured and modeled.

## Other reductions considered

| Option | Finding |
|---|---|
| Remove the four access covers | Exposes internal mechanisms or removes assembly access; does not meet the enclosed-product intent. |
| Merge the current output gear and thigh | In the current bearing arrangement, the gear and thigh lie on opposite sides of closed bearing rings. A simple CAD union traps the bearing and cannot be assembled conventionally. Moving the gear outboard also crosses the guide-link sweep. Not accepted as a paper-only part saving. |
| Print compound small pinions | Transfers highly loaded tooth roots to FDM plastic; requires strength evidence. Not assumed robust just to reduce purchases. |
| Buy assembled wheels | Can remove two prints, but may add hubs/screws and change mass, offset and traction. A verified complete wheel/hub could be useful later; no suitable drop-in is claimed. |
| Use a commodity geared hip motor | Reduces custom gearbox work, but the verified 37D example is far below the current model's jump-drive power. No substitute is selected. |
| One swinging arm per side | Removes joints, but a 150 mm arm matching today's 99.8 mm stroke moves its wheel about 131 mm fore/aft, versus 6.0 mm for the current linkage. Upright balance, compact packaging and jump control would change substantially. |

For the geared-motor comparison, the [Pololu 12 V 37D table](https://www.pololu.com/category/271/12v-37d-metal-gearmotors) lists 12 W maximum output and 330 rpm no-load for the 30:1 version. That is a verified example of why an easy-to-mount small gearmotor cannot simply be substituted for the present jump drive. Marketplace drill-gearbox claims were not accepted as engineering specifications.

## Assembly intent and next engineering gate

The intended assembly sequence is: install each rail and single-stage drive in a body half; install the wheel motor in each sliding leg; fit the qualified springs and slide in the legs; attach wheels and motor caps; then join the body halves. Mounting pads, spring guides, cable routes and locating features should be part of those prints, with no separate cosmetic carriers.

Before promoting this study to the build design:

1. Select and price a spring that actually meets the stroke, force and fatigue requirements, plus a rail/carriage assembly with usable specifications.
2. Detail one complete leg, its metal shaft/bearings, tooth interfaces, assembly path, stops and nested enclosure. Resolve cable travel without snagging.
3. Check static and landing loads, CAD interference through the stroke, printer orientation, tolerances and material choice. Slice this actual geometry before estimating plates or mass.
4. Build the new mass/friction/backlash model and balance/jump controller; qualify takeoff, landing and recovery. Do not transfer the old jump result by replaying its trajectory.

Reproduce the sizing with `.venv/bin/python design/simplification/study.py`. The checks assert part-count arithmetic, matched comparison travel and guide-travel allowance; they are not hardware qualification.
