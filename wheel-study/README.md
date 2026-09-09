# One-piece TPU wheel: revised 120 mm candidate

Local viewer, with the programmed jump playing by default:

http://localhost:8765/viewer/wheel.html?scene=robot&motion=jump

R2 clears the sampled CAD sweep and completes the programmed jump in native
MuJoCo. Nominal both-wheel ground clearance is **96.6 mm**, compared with
86.0 mm for the original 100 mm wheel plant using the same jump controller.
Corresponding centre-of-mass rises are 64.6 and 55.3 mm. The original plant
and its trained policies remain unchanged.

## Construction

| Item | R2 candidate |
| --- | --- |
| Tire, web and centre | One connected TPU 95A print per wheel |
| Diameter × tread width | 120 × 20 mm |
| Flat print envelope | 120 × 120 × 20 mm; one A1 Mini plate per wheel |
| Estimated TPU mass | 109.5 g each, CAD volume × assumed 1.2 g/cm³ |
| Tire centre track | 206 mm, previously 150 mm |
| Overall tire-to-tire width | 226 mm, previously 180 mm |
| Estimated complete robot mass | 2.292 kg, previously 2.448 kg |
| Actuators, springs and linkage | Existing four-motor arrangement |

The first wheel hit the housing and folded thigh. R2 narrows the tread,
recesses the coupling into the integrated centre, and moves each tire 28 mm
outward. A recessed centre alone cannot solve the thigh collision. This wider
stance increases axle overhang and affects get-up dynamics.

Each wheel uses one [Pololu 2693 8 mm shaft coupling](https://www.pololu.com/product/2693/specs),
three M3 ×8 socket screws and three Ø7 ×0.5 mm M3 washers. The coupling pair is
listed at $14.95 (checked 2026-09-08), the same SKU already used at the hips.
Three alternating holes of its six-hole Ø19.05 mm pattern mount the wheel.
A rear-open tool channel reaches the radial set screws. Two 80 ×8 mm steel
shafts replace the 61 mm shafts; a local 0.5 mm flat sits under each coupling,
away from the bearing seats. Motors, reduction gears and bearings are retained.
There is no separate printed rim.

The coupling CAD follows the [manufacturer drawing](https://www.pololu.com/file/0J1331/pololu-universal-aluminum-mounting-hub-for-8mm-shaft-m3-holes-dimensions.pdf).
Thread detail and radial screw holes are omitted from its simplified mesh;
the assigned 6.7 g coupling mass includes its supplied set screws.

## Verification

`revised/fit-report.json` checks both wheels at 105 hip angles each, from
−2.6 to +2.6 rad. A filled rotation envelope covers every tire angular phase
at each sampled leg pose. No interference was found; the minimum rigid CAD
clearance is **2.33 mm**, at the thigh lid. Mounting parts were also checked
against retained CAD at every fourth leg pose. Intentional shaft seating in
bearings and gear is excluded. This is a finite mesh audit, not proof of
clearance with a deformed TPU tire under load.

MuJoCo 3.10.0 uses the new CAD-derived wheel mass, COM and full inertia tensor,
120 ×20 mm rigid tire cylinders with the actual lateral offsets, and explicit
tire-to-skin contact pairs. Existing electrical motor models, spring limits
and linkage constraints remain active. Physics view shows these collision
shapes; Enclosed and Cutaway show detailed CAD.

| Programmed check | 0.5 ms / 0.25 ms result |
| --- | --- |
| Jump, nominal | Pass / pass; 96.65 / 96.04 mm wheel clearance |
| Jump, 20% heavier | Pass / pass; 94.32 / 94.61 mm |
| Jump, 9.6 V battery | Pass / pass; 78.59 / 78.52 mm |
| Lower and raise | Pass / pass |
| Catch 5° pitch + 0.2 m/s disturbance | Pass / pass |
| Drive 1.6 m and stop | Pass / pass; ~5.7 mm final distance error |
| Turn 90° and hold | Pass / pass; ~2.3° heading error |
| Back get-up, existing timing | Pass / pass |
| Left-side, front-left, back-right get-ups, retuned | Pass / pass |
| Right-side get-up, retuned | Pass / **fail**; remains an attempt |
| Front, inverted, front-right, back-left get-ups | **Fail / fail** |

These are exact-start programmed diagnostics with perfect simulated state
feedback, not learned skills or random-fall recovery. Fallen starts use the
archived orientations and joint states, adjusted vertically for the new
contact envelope. A 64-case search scaled timing and wheel torque; promising
settings were then recorded at both timesteps. Four of nine get-up families
currently pass both checks. Attempts remain labeled in the dropdown. Driving
needed stronger position correction after stopping to remove a ~114 mm
residual error. Jump timing was unchanged.

**Still unqualified:** TPU stiffness/damping, loaded deflection, grip and rolling
resistance, hub creep, bolt pull-through/preload, shaft material and gear
retention, bearing ratings, impact/fatigue strength and sealing. Inspect a
slice and bench-test the hub and loaded wheel before building a pair. No
new-wheel off-road or RL policy qualification follows from these flat-ground
rigid-wheel checks. R2 is not a hardware release.

## Files and reproduction

`revised/` contains `wheel.step`, `wheel.stl`, `wheel.json`, body-frame
`replacements.json`, CAD properties/hashes in `manifest.json`, and the isolated
`plant.xml`, `parameters.json` and `geometry.json`. Motion folders retain the
raw native records and summaries; `timing-search/` retains all 64 search cases.
`replays.json` indexes displayed recordings and requires matching checks at
both timesteps to label a motion passed.

```sh
.venv/bin/python design/wheel-study/revise.py
uv run --no-project --python /usr/local/bin/python3.11 --with trimesh --with python-fcl --with rtree python design/wheel-study/check_revised.py

env PYTHONPATH=src:scripts:design/wheel-study OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 \
  uv run --no-project --python /usr/local/bin/python3.11 --with mujoco==3.10.0 --with scipy \
  python design/wheel-study/check_motions.py --kinds jump \
  --variants wide_current wide_heavy wide_low_battery \
  --output design/wheel-study/revised/jump-verification
```

Use the same motion prefix for `--kinds height balance drive turn front back
left_side right_side inverted front_left front_right back_left back_right`,
or run `tune_motions.py` for the bounded search. Selected retuning:

```sh
env PYTHONPATH=src:scripts:design/wheel-study OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 \
  uv run --no-project --python /usr/local/bin/python3.11 --with mujoco==3.10.0 --with scipy \
  python design/wheel-study/check_motions.py --kinds back_right front_left left_side right_side \
  --settings design/wheel-study/revised/timing-search/settings.json \
  --output design/wheel-study/revised/retuned-motion-checks
python3 design/wheel-study/index_replays.py \
  design/wheel-study/revised/initial-motion-checks \
  design/wheel-study/revised/motion-checks \
  design/wheel-study/revised/jump-verification \
  design/wheel-study/revised/turn-verification \
  design/wheel-study/revised/retuned-motion-checks
```

CAD regeneration resets status flags; indexing updates them from the evidence.
The index checks fit/CAD hashes and nominal model identity; the browser checks
CAD, collision geometry and replay hashes before display. The repeated 100 mm
baseline matched the preserved 85.99 mm jump. No viewer publishing is performed.

## Archived R1 study

Parent-directory `tpu-wheel-120x25.*`, `tpu-wheel-140x25.*`, `catalog.json`,
`initial-fit.json` and `spacing-study.json` preserve the unsuccessful initial
concept. Both sizes hit the housing; 120 mm also hit the thigh near the jump
crouch. Their provisional four-hole mount is superseded. `generate.py` still
reproduces R1; `revise.py` produces R2.
