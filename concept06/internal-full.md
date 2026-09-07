# Full robot with enclosed internal knees

Open [the full assembly](http://127.0.0.1:8765/viewer/internal.html), or use
[the LAN viewer](http://192.168.86.226:8765/viewer/internal.html).
Choose **Cutaway → Focus knee → Cycle travel** to see the guide driving the
angled knee lever inside each thigh. The two height sliders work independently;
support blocks hold the prescribed split stance. **Compare exposed knee links**
shows the preceding round-wheel design alongside it.

This is integrated kinematic CAD. A [separate current-assembly validation](validation.md) now uses this mechanism,
CAD-derived mass/inertia and V2806 wheel motors in MuJoCo. It identifies failures;
this is not a manufacturing release. The earlier drivetrain recordings remain
explicitly separate.

## What changed

Both passive guides now fit behind the inner thigh lids. The tall fixed guide
ears are removed from the body. A carrier behind each body hip cheek supports
the concealed fixed pivot. The powered thigh moves around it, and the guide
rotates two short knee cheeks keyed to the lower-leg shaft. There is still one
height/jump motor and one wheel motor per side: **four motors total**.

The full assembly required more room around the knee shaft than the earlier
[isolated 14 mm lever study](internal-knee.md). Its lever is now 15.16 mm, the
guide's middle narrows to 8 mm, and the knee shaft grows to 8 mm. Pivot eyes stay
10 mm wide. The external lower-leg lever is trimmed away. Round 5:1 wheel pods,
100 mm tire envelopes and the two SWF12-50 springs are retained.

| Geometry | Full-assembly candidate |
|---|---:|
| Hip-to-knee distance | 64.482 mm |
| Knee-to-wheel distance | 119.119 mm |
| Fixed guide pivot relative to hip, X/Z | 18.68 / 12.55 mm |
| Guide pivot spacing | 65.59 mm |
| Knee lever pivot spacing | 15.16 mm |
| Lever indexing relative to lower leg | 197.77° |
| Hip angle range | 0.35–1.50 rad |
| Vertical leg travel | 100.121 mm |
| Steel guide | 4 mm thick; 8 mm stem; 10 mm eyes; 6.1 mm holes |
| Knee cheek pair | 3 mm metal plates with keyed 8 mm shaft bores |
| Guide pins / knee shaft | 6 mm / 8 mm nominal |
| Knee bearing allocation | 8 × 12 × 4 mm plain bushing |
| Local thigh profile at hip / knee | Ø61 / Ø47 mm |

These are proposed custom linkage dimensions. The shaft, carrier, cheek plates,
guide and bushing interfaces do not yet have released manufacturing drawings or
qualified suppliers. In particular, a short lever increases guide force for a
given knee torque; hiding it does not make it lightly loaded.

## How the enclosure fits

Each printed thigh is a structural cup with an inner spine. An inboard TPU lid
sits at |Y| = 57–59 mm, ahead of the complete guide mechanism. The guide occupies
67–71 mm; the spring axis is at 81.5 mm; the outer face ends at 91 mm. The fixed
body hip cheek overlaps the moving circular hip opening, concealing the guide
anchor without a sweeping guide slot.

The lower spring seat still moves through one curved opening in each lid. The
rigid portion clears its 11 mm post; a thin TPU membrane with a wiping slit
covers the opening. The post's larger root buttress stays below the lid.
Circular knee-boss and hip clearances, lid retention and the membrane need
physical development. These proposed closures are not a waterproof seal.

The compression spring is unloaded where its seat spacing exceeds its 50 mm
free length. A captive spring/guide arrangement must retain it throughout that
motion; the viewer's rod and caps do not establish a finished retention system.

## Parts and printing

There are **16 printed pieces**, down from 18 in the preceding round-wheel
assembly because the two guide links move to steel. Fourteen are allocated to
rigid polymer and two inner lids to TPU. Each exported print is a single valid
connected solid and fits a conservative 170 mm cube; the largest exported axis
is 166 mm. This fits the A1 mini's plate envelope, but does not establish slicing,
supports, dimensional accuracy or strength. Sixteen pieces is not sixteen plates;
no new plate nesting or slicer estimate has been made.

The compact mechanism trades printed pieces for metalwork. Per leg it allocates
one guide, two separate knee cheeks, one hip carrier with clevis, one 8 mm knee
shaft, two 6 mm guide pins, one bushing and four guide spacers/washers. The final
fastener and retention count is still open. The mesh component count in the
manifest is a rendering count, not a complete purchase BOM.

The four retained motors and two springs have a carried-over **$112.52 estimate**:
two X2216 V3 880KV long-shaft hip motors, two V2806 650KV wheel motors and two
SWF12-50 springs. It is not a refreshed quote or a complete robot cost. Controllers,
encoders, transmission hardware, the internal-knee metalwork, battery and shipping
are extra. The previous $75 motor/spring target is no longer the current subtotal.

## Verification and limits

`output/internal-full/motion-clearance.json` records selected solid-intersection
checks at 13 hip angles. The 25 pairs at each angle cover body, thigh, lid, wheel
pod, tire, guide, carrier, knee shaft, knee cheeks, guide pin/spacer and a
conservative spring envelope. One leg is sampled; the opposite is its mirrored
geometry. Both sides' exported solids are checked for validity. This is not an
all-pairs collision audit or a continuous swept-volume proof. Intentional fits,
spring seat ends and flexible wiping-membrane contact are excluded. The listed
intersection tolerance is 0.1 mm³.

All **325/325** selected solid checks pass. Minimum sampled lower-pod ground
clearance is 20.64 mm with the tires grounded.

`output/internal-full/kinematic-checks.json` independently records 501 nominal
closure and clearance samples, 200 perturbed geometries at 51 poses each, and
Python/browser solver agreement. Nominal screening finds 100.121 mm monotonic
travel, 3.351 mm minimum guide-to-hip-neck gap, 1.251 mm guide-to-knee-shaft gap,
0.959 mm conservative guide-to-inner-wall gap and 18.851 mm maximum spring
compression against the 20 mm design limit. Random tolerance samples are a
screen, not a worst-case tolerance stack.

All 200 perturbed cases pass this screen. Their minimum knee-shaft gap is
0.899 mm and maximum spring compression is 19.657 mm. The browser solver agrees
with Python to within 0.000001 mm in the checked poses; its legacy comparison
branch also reproduces the previous transforms.

The same report includes illustrative guide-force bounds using the old 2.1 kg
reference mass and a 0.45 N·m wheel moment. Those assumptions are not a new wheel
motor rating or measured landing loads. Fatigue, pin bearing, shaft torque
connections, carrier mounting, printed-body load paths, hard stops, impact,
off-road sealing and thermal operation remain unqualified. The carrier mounting
holes are allocated interfaces, not proof that the thin shell can carry them.

The next hardware step is a single metal-linkage/printed-thigh bench assembly:
finish positive torque connections and retention, verify the entire travel with
the actual spring, measure backlash and loads, then update full mass/inertia and
the MuJoCo dynamics before attempting a powered jump.

## Reproduce

```sh
.venv/bin/python design/concept06/internal_full.py --poses 13 --step
.venv-sim/bin/python design/concept06/check_internal_full.py
python3 design/viewer/serve.py --host 0.0.0.0
```

The first command exports the STEP assembly, print STLs, viewer meshes and
packaging audit. Unchanged drivetrain solids are cached under `/tmp` by source
hash; expensive retained gear meshes reuse the preceding round-wheel export.
All revised body, thigh, knee and lower-leg shapes are rebuilt from source.
