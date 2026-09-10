# Detailed CAD dynamics

This separate MuJoCo plant uses the current 340-part CAD composition, including
the flipped input pinions, compound shafts, mounting hardware and electronics
allocations. It retains four actuators, 120 × 20 mm rigid tire cylinders, the
same bending-leg geometry and spring, and the selected hip/wheel motor priors.
The frozen `native/` and training plant remain unchanged.

`mass-properties.json` estimates **2.60844 kg**, including **0.90267 kg of
full-density unsliced prints**. This is 119 g above the preceding simulated
revision. Unchanged parts retain the checked original mass properties; new
hardware, bearings, clips and electronics retain explicit unweighed priors.
Supplier gear/set-screw subdivisions count as one purchased component's mass.
The two hip motors retain the same unmeasured rotor/stator inertia allocation.

`drivetrain/implementation-checks.json` passes mass, centre-of-mass and inertia
conservation at 49 locked poses, 12 kinetic-energy cases and four free flights.
The six extra rotor/gear coordinates are passive, constrained to the same four
motor outputs. They include rotating-mass/carrier coupling; no additional
actuators, root support or prescribed motion are used during the trials.

## Programmed baseline

`baseline-trials.json` records exactly four nominal cases. The prior controller
is retained, with the earlier explicit-drivetrain launch lean of −0.26 rad.
Each case lasts eight seconds and includes a two-second settling gate.

| Timestep | Standing balance | Jump wheel clearance | COM rise after takeoff | Airtime | Settled landing |
|---|---|---|---|---|---|
| 250 µs | Pass | 264.18 mm | 194.64 mm | 0.4100 s | Pass |
| 125 µs | Pass | 265.42 mm | 194.44 mm | 0.4111 s | Pass |

The viewer defaults to the 125 µs detailed-CAD jump and offers its matching
standing balance. `viewer-replay.json` contains forward kinematics of the saved
coordinates and the compiled collision shapes. No root correction, hand
animation or resimulation is applied. Older recordings retain their original
CAD; the current terrain and recovery evidence is recorded on this detailed plant.

`balance-before-summary-fix-250us/` preserves the first completed balance trial
whose outer summary serialization failed on a NumPy boolean. Its original
runner is archived and hashed. The four final cases were run after that logging
fix; this was not a failed physical balance trial.

## One-wheel investigation

See `onewheel/static-screen.json` and `onewheel/hold-summary.json`. The static
screen finds weight/clearance/effort candidates on both wheels. The six local
feedback attempts all fail. This is neither a learned skill nor a demonstrated
one-wheel hold, entry or exit. The bounded controller study is stopped; its
failures do not establish that the hardware is incapable of the skill.

Four later loaded-equilibrium holds with current-aware requests also fail,
after roughly 2.0–3.8 seconds, at a hip travel guard. Their native recordings
are checked exactly. A larger local linear model gives inconsistent prediction
improvements, so that controller direction is paused. See
[the one-wheel evidence](onewheel/README.md); no dynamic one-wheel skill is qualified.

## Flip investigation

`flip/paired-authority.json` demonstrates 361–362° aerial rotation with
wheels-first contact at both tested timesteps, using the same motors and wheels.
A deeper tuck produces 371–372° but contacts the body. These short runs end at
contact, so neither proves a controlled landing. The twelve subsequent complete
trials in `flip-landing/summary.json` all fail. Early extension/braking causes
under-rotation and body strikes; stop that controller pattern. The next flip
iteration needs a complete takeoff/flight/landing trajectory, not more of those
switching thresholds. See `flip/README.md` for the fixed budgets and limitations.

The local viewer now offers **Experimental flip · programmed** (`?motion=flip`).
It shows the verified baseline ground launch, exact captured takeoff and the
125 µs wheel-first aerial recording, then pauses at first contact. The replay
does not append a landing from the ordinary jump. `flip-replay-check.json`
checks all 196 frames against their saved states, with zero pose/spring/clearance
error, and independently measures 361.94° from the displayed body axes.
The Mid-flip button, scrubber, slow playback, Cutaway and Physics views allow
inspection. This is an experimental rotation demonstration, not a passed flip
skill or a stable landing.

The subsequent sideways barrel-roll study also remains unsuccessful:
**0/24 complete turns**, with the selected attempt reproducing **169–170°**
and body-first contact at both timesteps. The viewer's **Side flip attempt ·
programmed · failed** mode (`?motion=sideflip`) displays that continuous
recording and stops at body contact. See `sideflip/README.md` and
`sideflip/paired-check.json`; no floor rolling or recovery is appended.

## Terrain driving

The explicit old-controller transfer screen passes only 2/26 cases on this
updated plant, both flat. A new programmed teacher then passes a 10° hill with
an on-slope stop, descent and final stop at both timesteps. Independent saved
state checks are in `terrain-control/paired-check.json`. Its path still drifts
sideways, so these are nominal demonstrations rather than robust navigation.

A contact-memory correction levels the body during a 15° cross-slope stop but
initially fails the lateral route limit. An explicit outer navigator then passes
flat, +10° hill and +15° cross-slope driving at both timesteps. Cross-slope drift
falls from 288–291 mm to 22 mm, with about 0.18° body roll during the stop.
The local viewer offers **Programmed cross-slope · 15°** and its matching terrain.

The new 13-case collection passes 12 cases, allowing one capped imitation fit
on seven training and five held-out episodes. The student then passes **8/10
physical evaluations**: flat, ±5° and +9° at both timesteps. The −9° valley pair
stays upright but falls short of the commanded distance. Those original results
remain in [the navigation evidence](terrain-navigation/README.md).

A stopping-distance preview in the external navigator now passes **10/10**
fixed conditions with the same frozen actor: four pilot development cases and
six regression cases, all audited. The viewer's **Learned hills · latest CAD**
now shows the passed -9° valley and links the complete cohort. See
[the stopping-preview evidence](terrain-preview/README.md) for calibration,
the exact simulator localization limitation, and the bounded harder screen.
That separate screen passes **0/6**: +/-15° rough/cross-slopes and +/-20°
hills/valleys all fail. Its failure audit passes; no failed case is repeated.
The frozen programmed teacher passes three of those six same conditions:
the +15° rough hill, +15° cross-slope and +20° hill. All three repeat at the
finer timestep. The matched comparison identifies a learned-policy gap on
those conditions; it does not qualify the remaining negative-slope failures.
See [the teacher comparison](terrain-preview/teacher-comparison/README.md).
Learned recovery stays deferred.

A fixed signed-terrain collection subsequently passes **17/30** full episodes,
with its complete recording audit passing. The planned broader fit remains
held because rough-terrain training lacks a passing negative example. One
separate cross-slope imitation fit then passes **3/4** coarse pilot conditions:
flat, −9° valley and −15° cross-slope. The +15° cross-slope stays upright but
misses distance and intermediate standing gates, so the candidate is stopped
without broader runs, fine confirmations or viewer promotion. Its saved-state
diagnostic identifies large corrective-action errors on learner-visited states;
the teacher passes that same positive cross-slope condition. See
[the collection](terrain-expansion/README.md) and
[the stopped candidate](terrain-expansion/cross-slope-student/README.md).

Subsequent continuous teacher takeovers repair the positive learner state but
worsen the negative control's stop. Four new positive correction demonstrations
pass 3/4; the +12° validation case loses one wheel's load in two recorded
samples. Its audit passes, but the fixed fitting gate does not, so no further
actor was fitted. This cross-slope approach is paused. See
[the correction evidence](terrain-expansion/cross-slope-corrections/README.md).

## In-place turning

The existing terrain actor initially leaves the in-place course in both turn
directions. A single measured yaw-bias correction lets its programmed teacher
pass both signed turn sequences at both tested timesteps, retaining the same
motors, commands and physical gates. Six new teacher demonstrations then pass
and are audited, allowing one capped imitation fit with the original passing
flat/hill/valley episodes retained for rehearsal.

That candidate passes **3/4** coarse pilot cases: flat, −9° valley and the
right-first turn. The left-first turn stays upright and reaches the requested
net angle, but drifts **266 mm** and fails late speed/yaw tracking. The audit
passes and identifies the failure in the saved recording. The candidate is
stopped without broader/fine testing or viewer promotion; the original actor
remains unchanged. See [the turning evidence](commanded-turns/README.md) for
the programmed successes, fit, failed pilot and offline diagnosis.

A separate bounded [PPO feedback experiment](commanded-turns/feedback/README.md)
completed eight rounds and 54,400 transitions with the base policy and hip
commands frozen. Local physics and remote CPU weight updates passed their
audits, but the final deterministic pilot passes only **1/4 cases**: both turns
drift too far and the valley overshoots. This candidate is stopped, with no
additional rounds, broader/fine tests or learned viewer promotion. Learned
recovery stays deferred. The separately audited programmed turn is now shown
as **Programmed turn · left / right** in the viewer.

## Limits

The model has rigid tires, ideal gear constraints without backlash, perfect
state feedback, approximate guide friction and nominal electrical priors.
It does not model flexible TPU, heating, battery sag, complete self-contact or
qualified print/machining tolerances. The nominal jump passes are not hardware
release, robustness or sim2real validation. Robust learned terrain driving,
controlled flip landings, one-wheel balancing and harder slopes remain open.
Programmed recovery with frozen learned balance passes forty fixed nominal
conditions; its scope and remaining limits are in
[the recovery evidence](recovery-transfer/capture-hold/heldout-falls/README.md).

Build with `.venv-sim/bin/python design/clanky-v2/detail_native.py`; audit with
`check_detail_native.py`, repeat the baseline with `detail_native_trials.py`,
then export using `export_detail_replay.py`. Mass changes require rerunning
`detail_mass.py` first and repeating all downstream source-bound evidence.
