# Wheel braking during the recovery return

The 120 mm wheels, four motors, manufactured geometry, hip trajectory and
learned balance actor remain unchanged. This is a programmed feedback-control
experiment, not new recovery-policy training.

## Why this change

The previous unified-controller evaluation left 11 failed starting poses,
each succeeding at the other physics timestep. The read-only diagnostic in
`checks/return-transition/summary.json` compares all 22 trajectories. Every
failed return crosses −100° sagittal angle and rolls onto the roof; none of
the successful partners crosses that angle. Their minimum return angles are
between −90.4° and −96.2°. Reconstructed gyro and subtree angular momentum
support investigating backward rotation during unfolding. This is a
correlation, not by itself proof of causation.

`ReturnBrakeController` adds only a wheel request during the symmetric
return-hips phase. It uses the pitch gyro with gain **0.06 N·m·s**, clipped to
**0.10 N·m per wheel**, at the existing 100 Hz control rate. Six short native
floating-wheel probes establish the motor reaction sign at both timesteps.
The unsupported initial pose in that diagnostic is deliberate; it is not
claimed as jumping, levitation or a recovery trajectory.

The motor current/voltage model and limits still determine actual torque.
Hip timing, body contacts, orientation routing, the 24-second continuous
trajectory and the final two-second standing criterion are unchanged. No
state reset, external body force, additional motor or automatic retry is used.

## Four-case preflight

All four preflight trials pass and the remote/local recording audits pass.
They cover front seed 87003 and perturbed front-left seed 84000 at 0.25 and
0.125 ms. The front pair exactly matches its old initial states and every
recorded state/action/current before braking; it improves from **1/2 to 2/2**.

**Setup correction:** the front-left baseline used a nominal start, while
the preflight used a perturbed start. Its two passes are not a matched repair
of that old failure. The frozen preflight runner's scope incorrectly calls
both starts existing matched comparisons. Its declared initial settings and
recordings are retained; `baseline-comparison.json` explicitly marks the
front-left pair unmatched. The following bank restores the exact original
perturbation settings for every regression case.

Evidence: `evidence/return-brake-preflight-01/`, including all four compact
native trajectories, source snapshots, fixed plan, audits and comparison.

## Frozen follow-up evaluation

One 54-trial bank uses the same gain and request cap without tuning:

- 20 trials: all ten prior near-floor failed starts at both timesteps, with
  their original seed and perturbation flag.
- 16 trials: all eight prescribed standing-release directions at both
  timesteps, including the eleventh old failed start.
- 18 trials: one fresh seeded near-floor start per nine fall directions,
  each at both timesteps; seeds 91000–91008.

The trial list, source identities and runtime are written before execution.
All failures remain in the bank. Fresh tests, known regressions and prescribed
falls are reported separately. These finite flat-ground tests do not qualify
arbitrary falls, sensor/terrain uncertainty, internal self-contact, printed
strength or physical hardware.

All **54/54 rollouts pass**, retaining the original final two-second standing
criterion and native mechanism/electrical guards.

| Cohort | Successful rollouts | Starts passing both timesteps | Matched old result |
| --- | --- | --- | --- |
| Prior near-floor failures | 20/20 | **10/10** | 10/20 rollouts; 0/10 pairs |
| Prescribed standing releases | 16/16 | **8/8** | 15/16 rollouts; 7/8 pairs |
| Fresh near-floor starts, nine directions | 18/18 | **9/9** | New starts; no matched baseline |

Thus all eleven previously failed starts now pass at both timesteps. The
fresh cohort is only nine starting poses, not the earlier 45-pose bank, so its
9/9 result should not be treated as a directly comparable general success
rate. Braking does not impose a −100° angle limit: the matched front preflight
still reaches roughly −104/−106° before returning successfully. The old
angle correlation diagnoses a trajectory problem, not a universal failure
threshold.

Evidence is retained in `evidence/return-brake-evaluation-01/`. Both remote and
local recording audits pass all 54 trials. The 36 matched regression/release
records have exactly equal initial states and pre-braking prefixes to their
old counterparts, including qpos, qvel, observations, actions and currents.
This directly controls for the preflight's setup mismatch. Original data and
source hashes remain intact.

Remote transfer inventories verify 101 original files totaling 76,834,026
bytes across preflight and evaluation. The authoritative remote audit remains
`recording-audit.json` because the follow-up references its hash; the independent
local result is retained as `recording-audit-local.json`. These audits reconstruct
recorded sensors, control decisions, sampled kinematics and final posture gates.
Continuous contact/electrical guards rely on the hashed runner; this is not a
second independent dynamics integration.

## Local replay

The existing front-recovery option now displays the **forward-left standing
release** from the new evaluation, labeled **Programmed fall recovery · wheel
braking**. The full 2,400-frame, 24-second trajectory contains the fall and
body impact, folding, gyro-braked return, back get-up and learned balance. Both
physics timesteps pass; the displayed record uses 0.25 ms.

The exporter verifies the frozen plant/CAD, source/audit/recording identities
and all 2,400 recorded COM and linkage states. A concave exterior screen checks
12 printed shells and both actual CAD tires across 481 sampled poses, finding
no cross-body surface intersections. It omits internal purchased mechanisms,
material deformation, containment, minimum/swept clearance and strength.

Local browser checks confirm the new motion label, the exterior fallen pose
at 2.4 s, the Cutaway leg return at 4.8 s and learned balance with both wheels
grounded in Physics view at 24 s. The existing programmed jump remains
available. Nothing is pushed or deployed.

The next learning step can use the improved controller as a source of recovery
demonstrations. A controller passing this finite bank is not yet a learned
recovery skill or a robust physical mechanism.
