# Back get-up with a learned balance endpoint

The unchanged **120 mm, four-motor V2** now gets up from a nominal back-fallen
start in native simulation at both **0.25 and 0.125 ms**. This is an optimized
programmed get-up followed by the learned balance actor. It is **not a learned
get-up policy** and does not yet meet the recovery requirement.

## Result and boundary

The original nominal start passes both full eight-second tests. The entire
final two seconds satisfy the existing standing and mechanism gates; continuous
standing lasts 6.06 seconds at the coarse timestep and 4.83 seconds at the fine
timestep. The nominal coarse result also reproduces on the local Mac after
optimization on the remote Linux CPU.

Ten fresh perturbed back-fall starts are each evaluated at both timesteps:
**15/20 rollouts pass, but only 5/10 starts pass at both timesteps**. Five starts
pass at one timestep and fail at the other. This timestep sensitivity makes the
fixed sequence unsuitable as reliable recovery. Including nominal cases gives
17/22 passes. All five failed attempts remain in the evidence and are counted.
They complete eight seconds without a plant rejection, but never reach stable
standing. Failed seeds are 77002, 77003, 77005, 77007 and 77009.

These are back-fallen geometric initializations at the ride hip angle, with
small orientation and velocity perturbations. They are not impact-generated
falls, settled-state distributions, different initial hip poses or all-family
coverage. Front, side, inverted and diagonal get-ups remain unproven on V2.

## Method and mechanism

One bounded cross-entropy trajectory search evaluates **192 candidates** on
the nominal back start, using three-second development rollouts. It optimizes
four symmetric hip targets, four symmetric wheel torque requests and the
duration of the initial sequence. The chosen candidate then receives full
eight-second independent evaluations. The search is finished and is not
being extended in a retry loop.

The successful command sequence folds both legs, then extends them while
coordinating wheel torque. Its four smooth command knots are:

| Time (s) | Hip target, both legs (rad) | Wheel request, each (Nm) |
| --- | --- | --- |
| 0.000 | 0.419 | 0.000 |
| 0.334 | −0.481 | −0.051 |
| 0.669 | −1.519 | −0.124 |
| 1.003 | 0.185 | −0.485 |
| 1.337 | 0.667 | 0.251 |

The targets above are requested values, not actual joint trajectories. At the
next 100 Hz policy boundary after 1.337 seconds, the frozen `balance-clone-02`
actor takes over. No body force, root pose correction or velocity reset occurs
after initialization. The same native hip PD, spring, motor electrical limits,
friction and selected-four-bar-branch guards remain active. Peak motor currents
reach the existing limits: 32 A hips and 8 A wheels at 11.1 V. Thermal duty and
battery sag remain unqualified.

The search cost only ranks candidates. Passing still requires eight seconds
completed, both tires grounded and body clear through the final two seconds,
COM lean and roll below 5 degrees, body linear speed below 0.1 m/s, angular
speed below 0.2 rad/s, hips within 0.08 rad of ride, and all native plant guards.

## Geometry and retained evidence

`evidence/recovery-shooting-back-01/` retains every search candidate, the frozen
sequence, source snapshots, the remote nominal eight-second recording and all
22 independent evaluations. `recording-audit.json` verifies identities,
currents, sampled forward kinematics and final-window checks while preserving
the failed results.

`exterior-screen.json` samples the nominal coarse trajectory every 50 ms,
including the last frame: 161 samples of 12 concave printed shell meshes and
the two actual recessed tire meshes, with recorded wheel spin. No cross-body
surface intersection is found in those samples or the nominal standing pose.
Internal mechanisms, same-body pairs, containment, minimum gaps, continuous
clearance, flexible wires, TPU deformation and self-contact dynamics remain
outside this screen. This result is not structural or physical qualification.

This experiment's original viewer entry showed **Programmed back get-up →
learned balance**. The later [settled-start study](SETTLED_RECOVERY.md) now
supplies that entry with a sensor-triggered handoff recording and its updated
test results. The historical immediate-start evidence remains here. Jump stays
the default, and nothing is pushed or deployed.

## Next action

The subsequent [residual PPO experiment](RESIDUAL_RECOVERY.md) is closed after
100 updates because its correction policy performs worse than zero correction
on matched fresh tests. It is not promoted or extended. A separate
[front get-up search](FRONT_RECOVERY.md) passes 7/10 fresh starts at both
timesteps, but retains nominal timestep sensitivity. The later
[settled-start study](SETTLED_RECOVERY.md) improves back paired passes from
6/10 to 10/10 using a measured-state handoff on matched starts. Next, develop
an inverted-specific contact maneuver and expand impact/fall-direction coverage.
The current evidence does not justify a motor or wheel change.
