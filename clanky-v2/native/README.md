# V2 native dynamics development

This is the first native MuJoCo plant of the **current V2 CAD composition**.
It retains four actuators, two closed four-bars, the two real prismatic spring
pistons and their passive connecting rods. After initialization, gravity,
contact and torque drive the robot. There is no root support or prescribed
joint motion. It does not inherit an R2 jump or learned-policy result.

## Robot identity and mass

`../native_cad.py` reproduces `viewer/v2.mjs`'s latest composition: both aligned
spring mechanisms, stock 16:1 hip gear layouts and the detailed **left** output
joint/case. The right side remains less complete. Every contributing CAD asset
and source script is hashed; a changed source requires regenerating its mass
report. Wheels and output gears are assigned to their physical rotating bodies,
even where the CAD viewer groups them with their carrier for pose inspection.

The current estimate is **2.489 kg**, including **0.805 kg** of prints. This is
not a measured or sliced mass. PETG uses 1.28 g/cm³, TPU 1.20 g/cm³ and full CAD
volume. Bought gears use catalog masses, while each complete V2806 is normalized
once to 47 g and each hip motor to 67.5 g. Camera, computer/cooling, battery,
controllers, wiring and missing mount/connection hardware have explicit priors
in `mass-properties.json`. They are not secretly massless keep-outs.

The 20T hip pinion's viewer mesh has an open tessellation seam. Its inertia is
computed from the original valid, placed supplier B-rep with
`../native_gear_properties.py`. No mesh hole filling or fabricated solid is used.
`gear-properties.json` binds that exact result to the source STEP and placement.

## What the plant represents

- 120 × 20 mm rigid tire cylinders on the CAD's 232 mm track; tilt-aware wheel
  clearance. Outer body/thigh/shin CAD convex hulls contact the ground.
- MISUMI SWF12-50 compression-only springs, 5.5 N/mm, driven through the actual
  18 mm knee crank, 30 mm rod and aligned slider. No tensile spring assistance.
- X2216 880KV hips through 16:1; V2806 650KV wheels through 5:1. The current-loop
  approximation enforces both current and voltage at each step. The default
  supply is 11.1 V, with assumed limits of 32 A per hip and 8 A per wheel.
- Relative rotor/pinion/intermediate inertia is reflected to each output as
  armature, in addition to aggregate device mass. Rotational cross-coupling and
  gyroscopic terms of separate rotating bodies are not represented.
- Sliding-guide friction in powered trials is 1 N plus µ times the preceding
  step's transverse guide-joint reaction, with µ = 0.2 by default. Damping is
  0.2 N s/m. These are identification priors, not measurements or wear ratings.

**Limitations:** no internal self-contact, deformable TPU, gearbox backlash,
structural flex/fatigue, thermal limits, real battery sag/regeneration design or
sensor estimator. The 32 A propeller-cooled hip rating is not a sealed-duty
rating. Foot-motor resistance and FOC current conventions remain unmeasured.
The current model can support early balance/jump investigation; arbitrary-fall
recovery and robust sim2real are not established by this contact model.

The subsequent [explicit drivetrain study](drivetrain/README.md) separates
rotors and compound gears from their carrier inertias without adding mass or
actuators. It retains 25.7–25.8 cm nominal wheel clearance with settled landings
after a small prelaunch-lean adjustment. The original controller narrowly
misses settling on that model. These newer recordings are separate from the
original armature-model viewer replay described below.

The [current terrain study](terrain/README.md) adds programmed driving on the
explicit-drivetrain model. At a 0.4 m/s command, its nominal 10/20 mm fixed-stone,
±5° slope and ±5/±10° cross-slope courses pass at two timesteps. The 30 mm stone
and 10° longitudinal courses remain unfinished. This is one course seed with
perfect-state feedback, not learned-policy or general off-road qualification.
The local viewer includes the successful 20 mm and blocked 30 mm recordings.

## Implementation checks

`implementation-checks.json` records 289 independent-leg pose combinations.
The native wheel centres, lower-link orientations and both closed mechanisms
agree with the CAD kinematics; spring plus gravity potential agrees with an
independent energy calculation. The mass matrix is positive definite.

Two unpowered free-flight checks use 0.25 and 0.125 ms timesteps. They retain
base joint friction/damping, with zero actuator torque; the powered trial's
additional reaction-dependent guide friction is not applied in these checks.
Neither creates mechanical energy. Maximum connection error is below 0.034 mm,
with no numerical warnings. These are implementation checks, not a jump pass.

## Reproduction

Use the CadQuery environment for source B-rep properties, and `.venv-sim` for
NumPy, trimesh and MuJoCo 3.3.7. Run sequentially after source edits:

```text
.venv/bin/python design/clanky-v2/native_gear_properties.py
.venv-sim/bin/python design/clanky-v2/native_mass.py
.venv-sim/bin/python design/clanky-v2/native_plant.py
.venv-sim/bin/python design/clanky-v2/check_native_plant.py
.venv-sim/bin/python design/clanky-v2/native_trial.py --balance --name first-balance
.venv-sim/bin/python design/clanky-v2/native_trial.py --name first-jump
```

The trial controller uses perfect state, approximate scheduled balance gains,
gravity/spring feedforward, current-limited hip tracking and contact-triggered
flight/landing transitions. Reports retain all failed checks. A stable finish
requires both wheel contacts and bounded speed, COM lean, roll and pitch rate
through the last half-second; a single upright frame is insufficient.
The required jump gate remains **250 mm wheel clearance with a stable landing**.
Trials below that target are not promoted into successful required-skill evidence.

## Current local viewer result

`native_viewer_trials.py` reproduces the selected programmed experiments, and
`export_native_replay.py` forwards the recorded generalized coordinates through
MuJoCo to produce `viewer-replay.json`. The viewer retains the complete current
CAD, overlays the compiled collision shapes in Physics, and never raises the
recorded robot to make it clear the ground. No new dynamics run in the browser.

The selected `deeper-tuck-3` controller now reaches **264.31 / 264.25 mm
wheel clearance** at 0.25 / 0.125 ms timesteps. COM rise from detected takeoff
is 195.02 / 195.42 mm. Both eight-second trials have no body strike or motor,
hip, spring or closure-limit failure, and satisfy the settling checks throughout
the final **two seconds**. The original 81 mm trial is preserved at commit
`6d3f645`; `viewer-controller-6d3f645.py` retains its exact controller source.

The hardware/geometry model is unchanged. A −0.25 rad preparatory COM-lean
reference ramps in before launch; this is achieved with wheel torque, never a
root-pose reset. An additional 5 ms launch tail delays premature hip braking.
The hips then retract to −0.1 rad in flight and prepare to land at 180 mm
remaining wheel clearance. The position reference changes to the touchdown
location. These are programmed feedback rules with perfect state, not RL.

The highest single screened nominal trial reached 271.45 mm with a deeper tuck.
The selected 264 mm trial uses earlier landing preparation and has been checked
at both timesteps. It is not a claim of a 264 mm COM jump.

`jump-validation.json` records an unchanged-controller, ten-case sensitivity
grid. **Only four cases pass the full 250 mm plus landing checks.**

| Hardware prior | Clearance, 0.25 / 0.125 ms | Result |
|---|---:|---|
| Nominal 2.489 kg, 11.1 V | 264.31 / 264.25 mm | Pass / pass |
| Mass +20% | 213.86 / 215.47 mm | Below target; settling fails |
| Mass −20% | 285.01 / 283.53 mm | Body strike; settling fails; one hip-limit failure |
| Supply 9.6 V | 265.29 / 265.26 mm | Body strike; settling fails; one hip-limit failure |
| Guide µ 0.4, tire µ 0.6 | 262.82 / 263.37 mm | Pass / pass |

These are uniform mass/inertia scalings and constant-voltage/friction priors,
not measured batteries or different fabricated CAD builds. The nominal jump
result is useful evidence for continuing with four motors; the **full jump
requirement remains incomplete** because the hardware-variation checks fail.
No random-start, arbitrary-fall recovery or physical qualification is implied.

The nominal five-second programmed standing balance also passes its checks.
It is not a disturbed-start or terrain balance evaluation.

To regenerate the selected sensitivity grid and local viewer without rerunning
already completed nominal cases:

```text
.venv-sim/bin/python design/clanky-v2/native_jump_validation.py deeper-tuck-3
.venv-sim/bin/python design/clanky-v2/native_viewer_trials.py --from-validation
.venv-sim/bin/python design/clanky-v2/export_native_replay.py
```

`selected-jump.json` binds the selected controller to its seed report. The
viewer exports the sensitivity results alongside the motion and links the
complete reports. It does not relabel failed mass or voltage cases as passes.

Earlier `launch-screen-*`, `launch-bias-*`, `flight-posture-*`, `first-*` reports
are historical controller diagnostics with their original hashes. Some predate
the new viewer source and the explicit jump requirement field. Their mass and
mechanical model are the same, but they are not current-source qualification
records. `initial-controller.py` preserves the first diagnostic controller.
The earlier launches without a preparatory lean reached roughly 20–22 cm but failed their landings.
One 206 mm attempt drove the wheels to approximately 1,416 rpm in flight;
voltage-limited wheel torque then fell while forward pitch persisted. The new lean/tuck sequence resolves that nominal trial, but voltage sensitivity
and inertia approximations remain open. This is not evidence
that four motors are impossible or that more vertical power alone solves it.
