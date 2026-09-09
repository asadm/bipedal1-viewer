# Settled starts and a sensor-triggered balance handoff

The 120 mm wheels, four motors, native plant, motor ceilings and existing
`balance-clone-02` actor are unchanged. This experiment adds a programmed
supervisor; it does not train a new recovery policy or resume the failed PPO
recipes.

## Continuous settling

The robot starts in a CAD-supported fallen pose, then the existing motors hold
the ride hip targets for three seconds. Dynamics determine its motion and
resting pose. There is no position/velocity correction, motor-current reset,
guide-history reset or simulator-clock reset before the get-up. Recovery then
runs for a further eight seconds through the same guarded motor interface.

These are dynamically settled near-floor initializations, **not falls from
standing or impact-generated resets**. During the last half-second of settling,
body speed must stay below 0.01 m/s, angular speed below 0.05 rad/s and the body
must remain fallen. The original continuous final two-second standing criterion
is unchanged. All tested signals are ideal; ground and hardware parameters are
not randomized.

The first diagnostic covers all nine initial fall directions at 0.25 and
0.125 ms. All 18 complete with valid native guards. Front, back and inverted
retain their original fall family and settle. Several side/diagonal starts
roll into a different orientation; right and front-left are still moving at
three seconds. In particular, the left-side start settles upside down, while
the back diagonals settle into a back-fallen pose. Selecting a recovery solely
from the original fall label would therefore be incorrect.

With the old timer, nominal settled front get-up passes both timesteps.
Nominal settled back get-up passes only the finer timestep. This differs from
the earlier immediate geometric starts and is retained as a separate test.

## One measured-state handoff rule

After both hips have folded below −0.5 rad, the supervisor can hand over to the
frozen learned balance actor when all of these measured conditions hold:

- Upright component of gravity exceeds 0.9; fore/aft and lateral gravity
  components have magnitudes below 0.4 and 0.2.
- Both hips exceed 0.15 rad and differ by less than 0.15 rad.
- Gyro magnitude is below 6 rad/s and both hip speeds are below 6 rad/s.

The decision uses only the existing gyro, projected gravity and hip encoders.
It is latched once. If it never triggers, the original sequence duration still
hands over to balance. Hip targets, wheel requests, current limits, PD loop and
learned weights are unchanged. This only changes the transition into balance;
earlier get-up phases remain timed.

In the four nominal preflight rollouts, all pass. Back handoff occurs at 1.11 s
and 1.08 s after the settling period, instead of waiting approximately 1.34 s.
The front handoff rule does not trigger early, and both front recordings match
their old-timer counterparts.

## Matched fresh evaluation

The fixed rule is evaluated once on ten fresh perturbed starting poses per
direction, seeds 81000–81009. Each pose receives three seconds of settling,
then eight seconds of recovery at both timesteps with both controllers:
80 rollouts. A start counts as a paired pass only when both timesteps pass.
The completed report is `evidence/feedback-recovery-evaluation-01/summary.json`.
The comparison is complete:

| Direction and controller | Successful rollouts | Starts passing both timesteps |
| --- | --- | --- |
| Front, original timer | 17/20 | 7/10 |
| Front, sensor handoff | 17/20 | 7/10 |
| Back, original timer | 16/20 | 6/10 |
| Back, sensor handoff | **20/20** | **10/10** |

All 80 complete 11 seconds with valid native guards, and all starting poses
settle within the stated criteria. The front rule never triggers early: its
20 trajectories are identical to the matched timer trajectories. The three
front failures are seed 81006 at 0.25 ms, 81007 at 0.25 ms and 81008 at 0.125 ms.
The new back supervisor improves this finite test set and is selected for the
local back replay. This is not proof of general 100% back recovery: the starts
use the same hip pose and converge toward similar resting configurations;
there are no impacts, hardware randomization, estimator errors or terrain.
This experiment is finished with no automatic extension or repeated tuning.

## Inverted recovery and next action

Four additional tests apply each existing front/back sequence to a nominal
inverted start at both timesteps. **All four fail to recover**, while completing
the full settling and recovery duration with valid mechanism/electrical guards.
These transfer attempts are finished; they are not an inverted-motion search.

A separate 101-pose static geometric sweep finds 26 deeply folded symmetric
leg poses where both tires can support the upside-down body on the floor.
The sampled interval is −2.75 to −1.805 rad. This establishes a possible contact
configuration, not an attainable motion: it does not check self-intersection,
required torque, stability, continuous reachability or strength. The subsequent
[inverted recovery study](INVERTED_RECOVERY.md) finds that wheel-driving from
that hypothesized contact fails: the moving body tips onto its back first.
Using that tip, slowly returning the legs, then reusing the back get-up passes
9/10 fresh inverted starts at both timesteps. No roof or actuator change was
needed for that partial result. Side/diagonal recovery, the remaining transfer
failure and actual impact falls remain required work.

## Evidence and viewer

- `settled-recovery-01/`: 18 settling diagnostics, including the four timed
  front/back get-ups.
- `feedback-recovery-preflight-01/`: four nominal handoff tests and full native
  recordings for the viewer geometry check.
- `feedback-recovery-evaluation-01/`: all 80 matched tests, including failures.
- `inverted-transfer-01/`: four failed transfer tests and the static reach sweep.

All paths above are under `evidence/`. Compressed recordings retain pre-action
observations, raw policy requests, actual positions/velocities, currents and
contact/standing flags. Raw learned outputs can exceed ±1; the unchanged native
interface clips them before applying motor commands. The audits check that
clipped action in the following observation, independently reconstruct sampled
IMU/encoder inputs, verify action decisions and preserve all failed results.
The audits also check source identities, continuous time and qpos/qvel/current
preservation at the settling handoff, sampled linkage geometry and final-window
posture gates. Contact forces and continuous physics guards rely on the hashed
runner; these are not independent full dynamics reruns.

The viewer's existing front/back get-up entries now show these complete
11-second nominal preflight recordings. They retain the three-second settling
period and label the get-up as programmed. Front shows its unchanged timed
sequence; back shows the sensor-triggered early handoff. Both examples pass at
both timesteps, and their labels state the fresh paired results. No duplicate
get-up entries are added, and jump remains the default motion. Use
`export_settled_recovery.py` to reproduce the current selection; the earlier
`export_recovery_shooting.py` reproduces the historical immediate-start demos.

The two nominal preflight geometry screens each sample 221 points along the
complete 11-second record, using 12 concave printed shells and both actual CAD
tires. They find no cross-body surface intersections. This omits internal
hardware, containment/minimum clearance, continuous path clearance and strength.
No change to the wheels, motors, body or springs is made. Nothing is pushed.
