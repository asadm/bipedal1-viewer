# Explicit drivetrain study

This study tests the same four-motor robot and selected programmed jump with
the motor rotors and intermediate gears represented as moving bodies. It is an
experimental plant alongside `../model.xml`; it does not change the hardware,
the controller or the viewer's existing recording.

## Physical bookkeeping

The robot remains **2.489247159 kg**. Six passive rotating groups are separated
from the existing chassis/shin inertias, with no mass added:

| Group, per side | Mass | Rotation relative to output | Shaft inertia |
|---|---:|---:|---:|
| Hip rotor + 15T input pinion | 34.1 g | +16 | 4.21152 × 10⁻⁶ kg m² |
| Hip 60T / 20T compound | 29.0 g | −4 | 5.66678 × 10⁻⁶ kg m² |
| Wheel rotor, 20T pinion, shaft, screws and magnet | 26.864 g | −5 | 3.29180 × 10⁻⁶ kg m² |

The wheel gear pair reverses the motor's rotation; two external hip meshes
preserve the input/output direction. Output gears already belong to the
moving thigh/wheel bodies in the original plant and are not counted twice.
The explicit version removes the corresponding joint armatures.

The hip motor's internal split is **an unmeasured prior**: 25 g of its existing
67.5 g allocation is represented by a rotor with axial inertia 4 × 10⁻⁶ kg m²,
12 mm axial height and an equivalent ring radius of 12.65 mm. The stationary
motor remainder retains a physically valid inertia. The wheel motor's
illustrative CAD subdivisions share its catalog total mass; the resulting
rotor inertia is not a measurement of the purchased motor.

MuJoCo's joint armature represents additional relative joint inertia. A
separate rotating body also contributes to the complete robot's angular
momentum and the cross terms in kinetic energy. This study uses linear joint
equalities for the gear ratios, following the
[MuJoCo 3.3.7 joint and equality definitions](https://mujoco.readthedocs.io/en/3.3.7/XMLreference.html#equality-joint).
These are ideal transmissions with finite numerical constraint error, not
tooth contact, backlash or elastic gearbox models.

The same four equivalent output torques and current/voltage/loss approximation
remain in use. With an ideal ratio, motor-side torque divided by the signed
ratio and an equivalent output torque perform the same virtual work. This
does not identify the real motor current convention, efficiency or inertia.

## Implementation checks

`implementation-checks.json` covers:

- 49 independent-leg poses: unchanged total mass and locked-rotor mass
  distribution, plus unchanged linkage closure. Compiled inertia differences
  stay below 10⁻⁹ kg m²; full-inertia diagonalization introduces small rounding.
- 12 velocity cases: explicit kinetic cross terms and rotor angular momentum
  agree with independent rigid-body calculations within 10⁻⁸ J / N m s.
- Four 0.18 s free flights, passive and internally powered, at 0.25 / 0.125 ms:
  no passive energy creation, no ground contact, no warnings, gear error below
  0.001 rad at the output and linkage error below 0.1 mm. Angular momentum
  drift remains below 10⁻⁴ N m s. It is finite, not exactly conserved: the
  connections have numerical compliance.

The explicit study uses **RK4**. Screening with the original `implicitfast`
integrator produced up to 0.001107 N m s angular-momentum drift during the
powered free-flight pulse at 0.25 ms; RK4 reduced that to 0.0000457 N m s.
The comparison includes an integrator-only case so this numerical change is
not attributed to a mechanical improvement.

## Jump result

`jump-comparison.json` records the unchanged original controller. All rows use
the same CAD, mass, actuator limits and 250 mm wheel-clearance target.

| Representation | Clearance at 0.25 / 0.125 ms | Full nominal trial |
|---|---:|---|
| Original armature + implicitfast | 264.31 / 264.25 mm | Pass / pass |
| Original armature + RK4 | 264.22 / 262.65 mm | Pass / pass |
| CAD-based armature + RK4 | 263.47 / 261.62 mm | Pass / pass |
| Explicit rotating groups + RK4 | 262.33 / 261.68 mm | Settling speed fails both |

The unchanged controller does land without a body strike on the explicit
plant. It narrowly fails because peak speed over the final two-second window
is 0.1024 / 0.1124 m/s against the unchanged 0.1 m/s limit. At the end it is
slowing, but that does not count as passing the entire settling window.

`lean-refinement.json` screens three nearby preparatory COM-lean references.
Changing **only −0.25 to −0.26 rad** gives **258.42 / 257.37 mm** wheel clearance
with both trials passing. The final two-second peak speeds are **0.00657 /
0.00287 m/s**. The −0.24 rad trial falls and is retained as a failed case;
−0.27 rad passes the first timestep with less clearance and more residual
speed. The selected −0.26 rad case is repeated at half timestep.

This is a roughly 0.57° adjustment to a feedback reference achieved by wheel
torque before launch. There is no pose reset, additional actuator, mass
reduction, stronger motor or relaxed target. COM rise remains approximately
192 mm; the 258 mm measurement is wheel clearance, aided by leg retraction.

Peak modeled wheel contact forces remain hundreds of newtons (about 759 N in
the finer selected trial). The rigid tire/contact model does not qualify the
printed parts, gears, bearings or shafts for those landing loads.

The original viewer continues to replay the original 264 mm armature-model
trial. The explicit model and its recordings are retained here for the next
control/terrain work. Its new controller has **not** yet passed a hardware
sensitivity grid; the original plant's 4/10 grid cannot be transferred to it.

## Reproduction

```text
.venv-sim/bin/python design/clanky-v2/check_native_drivetrain.py
.venv-sim/bin/python design/clanky-v2/native_drivetrain_trials.py
.venv-sim/bin/python design/clanky-v2/native_drivetrain_refine.py
```

The runner checks source hashes and executes the **unchanged** controller in
`../selected-jump.json` for eight seconds, requiring settling throughout the
last two seconds. It compares the original plant, RK4 alone, CAD-derived
armatures with RK4, and explicit rotors with RK4, each at two timesteps.
Each recording contains the actual generalized coordinates and model identity;
the additional gear constraint audit samples those coordinates every 10 ms.

This is nominal-start simulation evidence. Hardware variations, arbitrary
falls, terrain, thermal limits, structural qualification, fabrication and
sim2real identification remain necessary.
