# Supported hip study — not adopted

This is a **left-side development study**, separate from the body/wiring
assembly committed as `22d1786`. The main viewer continues to show that assembly.
`joint.step` and `parts.json` show the proposed support at the existing ride pose
and in each part's local frame, respectively. No input motor or hip reduction is
installed, and no V2 jump, recovery or balance claim follows from this study.

The support uses two 8 × 16 × 5 mm F688 bearings on a fixed 8 mm spindle. A keyed
steel arm anchors the hidden knee tie beyond both bearings. A C-HCDG5-10 smooth
pivot, GSM-0506-05 bush, thrust spacer and clip replace an unsupported pin
allocation. The spring moves 5.5 mm inward without changing its XZ kinematics.
The tie's 3 mm stem moves 0.3 mm inward, leaving nominal 0.3 mm clearance from
the static anchor. Its root is 5 mm thick for the stock bush.

There are **28 solids replacing six existing solids on the left**, a net increase
of 22 modeled parts. The four replacement prints are still single connected
parts, so this study adds no separate enclosure print and no actuator. This is
not a finalized purchase count: spacers, shaft ends, anchor, body plate and tie
include custom processing. Reducing that hardware and obtaining costs remain
part of the design task. No durability or low-cost claim is made for this stack.

## Nominal packaging checks

Run the following in order; CadQuery uses the project `.venv`, while the mesh
check needs trimesh/python-fcl/rtree:

```text
.venv/bin/python design/clanky-v2/hip_joint.py
python design/clanky-v2/check_hip_joint.py
.venv/bin/python design/clanky-v2/check_hip_exact.py
.venv/bin/python design/clanky-v2/hip_spring_load_screen.py
```

`fit-diagnostic.json` retains every new mesh contact across 405 symmetric poses,
using conservative wheel-drive and spring envelopes. Its raw `passed` flag is
false when nominal mating faces remain to be classified. `exact-diagnostic.json`
classifies those contacts against an explicit interface list, requires zero
overlapping CAD volume, checks all new-part pairs at ride for contained solids,
checks tie/anchor running clearance, and checks chassis additions against all
four electronics reservations. Read both reports together. A nominal mating
surface is not a chosen press fit, a tolerance stack or a retention/load proof.

The first stack's outer bearing and retainer hit the folded shin. Both bearings
now sit inboard at Y=64.5–69.5 and 80.5–85.5 mm. The static tie anchor is at
89.5–92.5 mm. The locally raised cover ends at 97.3 mm, before the shin plate
starts at 97.7 mm. These are nominal positions, not tolerance margins.

`first-stack/` preserves the initial interference diagnostic and its source.
`second-stack/` preserves the subsequent exact failures: the body around an
inner spacer, the spring-slider channel, and overlapping cover bosses. Later
geometry removes those overlaps. These archives are historical, not current
passing evidence.

## Spring support is still an adoption blocker

The previous planar guide calculation omitted the lateral distance between the
spring and its connecting rod. The rod centre plane is Y=88 mm. The current
assembly's spring is at Y=80 mm; this study's spring is at 74.5 mm. Both therefore
need a three-dimensional slider load path.

`spring-load-screen.json` applies the same quasistatic spring loads to an ideal
5 mm round steel beam supported at X=0.5 and 11 mm. Its conditional results are:

| Quantity | Current assembly | Supported-hip study |
|---|---:|---:|
| Lateral offset | 8 mm | 13.5 mm |
| Combined bending stress | 136.9 MPa | 166.8 MPa |
| Combined elastic tip displacement | 0.220 mm | 0.291 mm |
| Maximum front-guide reaction | 190.7 N | 220.9 N |
| Roll moment needing restraint | 278.6 N·mm | 470.1 N·mm |

These are **conditional calculations, not strength passes**. Round guide bores
alone do not react the roll moment. The slider/shaft clearance hole is also not
a defined bending clamp. A positive anti-rotation constraint, retained shaft
interface, guide pressure/wear/creep analysis, selected shaft grade and impact
loads are required before adoption. Assuming a planar joint in simulation would
hide these unresolved physical interfaces.

A possible replacement is a cut-to-length **5 mm hex stainless shaft**, which
could give the existing guide two functions without another loose part.
[REV's stock shafts](https://www.revrobotics.com/5mm-Hex-Shafts/) are SUS303 and
include a 75 mm option, REV-41-1347-PK4. The product family lists $12.50–23.25
for four-packs as checked 2026-09-08; that is not a quote for a particular length.
Its [drawing](https://revrobotics.ca/content/docs/5mm-Hex-Shaft-DR.pdf) uses
5.0 mm across flats with a general ±0.10 mm one-decimal tolerance. The nominal
corner diameter is 5.77 mm, smaller than the allocated 6.5 mm spring bore.
**It is not in this CAD.** Printed sliding-fit lash, corner wear, retention and
combined loads must be assessed before selecting it; stock availability alone
does not resolve the support.

## Hardware basis and remaining work

- [SMB F688-2RS drawing](https://www.smbbearings.com/firebrick/ckeditor/plugins/upload/Uploads/Documents/bearingpdfs/F688-2RS-flanged-miniature-bearing-8x16x5mm.pdf):
  8 × 16 × 5 mm, flange 18 × 1.1 mm. Bearing envelopes do not model the internal
  races, their friction or load distribution.
- [MISUMI pivot catalog](https://my.misumi-ec.com/pr/vona/free_download_misumi_economy_catalog/pdf/Index_010_Pivot%20Pins_Cantilever%20Shafts.pdf):
  C-HCDG5-10, 5 mm shaft, 8 mm head, 10 mm shoulder-to-groove dimension,
  4 mm groove, JIS No. 4 clip. The neck-relief diameter is an explicit envelope
  assumption; the separate clip is an annular envelope, not its installed shape
  or a retention calculation.
- [Igus G300 catalog](https://www.igus.com/ContentData/Products/Downloads/iglide_G300_FM_USen.pdf):
  GSM-0506-05, 5 × 6 × 5 mm. Housing tolerances, pressure, wear and thrust
  behavior require their own check.

The D435i, Pi/cooling, battery and controller allocations remain unchanged.
The support is not yet mirrored into a complete robot. Hip gearing/motor mounts,
spring constraints, the knee-pin stack after the tie shift, fits, fastener locking,
printed boss strength, complete mass and all required dynamics remain open.
