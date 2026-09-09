# Commanded driving on the selected 120 mm design

This experiment teaches forward/reverse speed, turning, curved driving and a
final stop on the unchanged 2.489 kg, four-motor native V2 plant. It keeps the
120 mm rigid tires, springs, motor limits and linkage constraints. It does not
replace the existing balance or recovery actors or claim terrain capability.

## Actor contract and learning method

The current balance actor ignores all command inputs. The new actor retains
the 25-input, four-action contract but enables columns 19 and 20: commanded
forward speed (m/s) and yaw rate (rad/s). It observes gyro, projected gravity,
hip encoders and velocities, and wheel velocities. Acceleration, previous
actions and the remaining command fields are masked. It receives no world
position, simulator velocity, contact state, elapsed time or future command.

`CommandTeacher` extends the existing privileged-state balance reference. It
balances along the robot's current heading, subtracts the requested forward
speed in the velocity feedback, and uses differential wheel torque for yaw.
The teacher never intervenes during a student rollout; it only supplies labels
at the student's visited states. Geometry, voltage and torque/current limits
are unchanged.

`command_learning.py` initializes from the learned V2 balance actor, then fits
teacher labels. A first-layer weight/bias transformation preserves the old
function when observation normalization changes. The fit has a fixed 2,500
update cap and a whole-episode validation split: episodes 0–23 train, 24–31
validate. Only validation label error selects the saved checkpoint. A separate
closed-loop bank measures command following. At most one additional DAgger
collection/fit is allowed in this study if the first actor needs correction.

## Motion bank and gates

Each sequence starts with one second at zero command, followed by three
four-second command segments, then a four-second stop interval. Commands ramp
over 0.6 seconds. Named profiles cover forward/reverse, both turn directions,
arcs, mixed driving and stationary balance. Random profiles draw speed from
−0.7 to +0.7 m/s and yaw rate from −1.2 to +1.2 rad/s, including zero components.
This is a first command-following range, not a maximum-speed claim.

Successful runs must finish all 17 seconds without a fall or native failure,
have no sampled body-ground contact and remain below 8° roll throughout.
During the last second of each driving segment, forward-speed RMSE must be
below 0.10 m/s and yaw-rate RMSE below 0.25 rad/s. After stopping, the original
continuous two-second standing gate must pass. All failures remain failures;
holding balance while ignoring a movement command cannot pass.

The student evaluation fixes 12 fresh starts across six profiles (including
zero command and random commands), each at 0.25 and 0.125 ms physics steps.
Both standing and tilted starts are included. The final standing gate is
checked at every physics step. Native current, voltage, gear, linkage, spring
and assembly-branch guards retain their original scope.

## Reference development

The first completed eight-case preflight uses the original 0.07 yaw feedback
gain and a 16-second horizon. **0/8 pass all gates**, although all finish without
a fall/native failure and all track forward speed. Turning tracks too weakly;
moving profiles provide only 1.37–1.49 seconds of stable standing at the end.
The audit reconstructs all eight runs and retains their failures.

One targeted revision increases yaw feedback to 0.35 and adds one second to
the stop interval. It leaves tracking tolerances and the required two seconds
of stable standing unchanged. This is a changed controller/horizon comparison,
not a matched success-rate estimate for the same experiment.

Two harness incidents are retained separately: a JSON serialization failure
after simulation, and a launch that preceded completion of the revised source
transfer. The latter bound the old controller in its plan and is excluded from
new-controller evidence. Neither is counted as a successful driving test.

## Evidence limits

The command auditor checks source, plan and recording identities; initial
states; every command, teacher label and student action; and sampled motion,
COM, roll and linkage kinematics. It recomputes tracking and standing gates.
Continuous physical/contact flags still rely on the hashed native runner.
These nominal flat-floor tests do not establish offroad driving, robustness to
sensor or hardware uncertainty, compliant TPU tire behavior, internal self-contact, printed strength
or hardware transfer. Full fall recovery remains open in
[the recovery study](UNIFIED_RECOVERY.md).

## Revised reference and first learned actor

The revised reference passes **8/8** nominal preflight trials at the two physics
timesteps. Its recording audit passes. Demonstration collection finishes all
32 sequences without a fall or native failure; 26 meet all motion gates. Four
tilted starts exceed the strict whole-run 8° roll limit, and two sequences do
not complete two seconds of stable standing before the deadline. Those six
failures are retained, including their valid command/teacher-label samples.

The first fit uses **40,800 training samples** and **13,600 validation samples**.
It completes the fixed 2,500 updates and selects update 2,499 by validation
label error. Warm-start renormalization changes the initial actor's sampled
outputs by at most 3.58e−7. The exported NumPy actor differs from PyTorch by
at most 1.50e−7 on the export check. These numerical checks are separate from
closed-loop driving success.

## Completed student evaluation

The fixed 24-run evaluation finishes without a fall or native failure.
**20/24 runs pass every gate**, corresponding to **10/12 fresh starting
sequences passing both physics timesteps**. All 24 pass each speed/yaw tracking
window and the original continuous two-second standing check after stopping.
The largest measured window RMSE is **0.0404 m/s forward speed** and
**0.160 rad/s yaw rate**. No teacher commands the motors during these runs.

| Profile | Paired passes | Rollouts passing every gate |
| --- | --- | --- |
| Forward/reverse | 2/2 | 4/4 |
| Turn both ways | 2/2 | 4/4 |
| Curved driving | 2/2 | 4/4 |
| Mixed driving | 1/2 | 2/4 |
| Zero-command balance | 2/2 | 4/4 |
| Random commands | 1/2 | 2/4 |

The four failures are both timesteps for mixed seed 88309 and random seed
88311. Their only failed gate is the strict whole-run 8° roll bound. Peak roll
occurs in the first recorded sample (0.01 s): about −11.35° and +9.93°,
respectively. They remain outside the bound until 0.08 s and 0.06 s, then
stabilize and complete the commands. They remain failed trials under the
unchanged definition; this is not reported as 24/24 overall recovery or driving.

No DAgger correction is run: the remaining gate misses occur during the initial
tilt transient, while all command and stop checks already pass. This capped
fit/evaluation is closed. The new actor is a separate learned driving option;
the earlier balance and partial programmed recovery remain available.

## Local replay and audit

The local and remote audits both pass for all 24 student recordings; the local
audit independently rebuilds sensor inputs, labels, actions and sampled motion.
Seeded random float64 command scaling differs by about 1e−16 between ARM and
x86, so the local checker allows 1e−14 for command reconstruction. It retains
the recorded command targets and leaves every physical success gate unchanged.
The original remote audit and its source are retained beside the local audit.

The viewer example is **mixed seed 88303**, passing at both timesteps. It shows
the full 17-second record: forward speed +0.6 m/s, then +0.35 m/s with +1 rad/s
yaw, reverse at −0.4 m/s with −0.6 rad/s yaw, then zero command and stable
standing. The displayed poses come from the 0.25 ms run. The actor supplies
all four motor actions; the command schedule is prescribed. Per-frame text
shows commanded and measured speed and yaw rate.

The exporter verifies current CAD/model identities, native body transforms and
all 1,700 recorded COM/linkage samples. An exterior screen checks 341 sampled
poses using 12 concave printed shells and both actual CAD tires; it finds no
cross-body surface intersections. This does not qualify internal mechanisms,
continuous swept clearance, TPU deformation or strength. The existing jump,
balance and recovery options remain available locally. Nothing is pushed.

Browser QA verifies the new dropdown option, command/measurement telemetry,
the turning exterior at 6.8 s, and the stopped pose at 17 s in Cutaway and
Physics views. No console errors were recorded. Driving left the original
3 m display floor, so the replay now uses an extended ground grid and a shadow
camera that follows its position. Switching to jump restores the inspection
floor and light. These changes affect display only; all native poses remain
unchanged. The delivered tab plays learned driving in Exterior view.

Evidence: [student evaluation](evidence/command-clone-01/evaluation/summary.json),
[failure timing analysis](evidence/command-clone-01/evaluation/analysis.json),
[local recording audit](evidence/command-clone-01/evaluation/recording-audit.json),
[learned actor manifest](evidence/command-clone-01/manifest.json), and
[verified transfer inventory](evidence/command-transfer-01.json).
