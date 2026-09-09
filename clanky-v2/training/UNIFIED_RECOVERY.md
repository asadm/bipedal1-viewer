# Consistent roof selection and a slower front get-up

This study keeps the **120 mm wheels, four motors, native plant and learned
balance actor** unchanged. It makes two bounded controller changes based on
the previous failure recordings. These are programmed recovery changes;
there are no new learned recovery weights in this study.

## What the failures showed

Fourteen fresh failures in the preceding evaluation never attempted a get-up.
They started at a quiet tilted-roof rest, approximately projected gravity
`[0, ±0.645, 0.764]`. The extended roof rule existed only after a side fold.
`UnifiedController` now uses that same rule at initial selection too. The
three-second minimum settling period, quiet/hip checks, timeout and original
standing success gate are unchanged. Four preflight trials on two earlier
left/right failed starts pass at both timesteps.

The failed front get-ups expose a different problem. The old timed sequence
was selected both from a prone front rest (gravity approximately
`[0.952, 0, 0.307]`) and a partly upright front-facing rest
(`[0.904, 0, -0.428]`). Their wheel support differs. Even among the prone
starts, small contact differences changed the fast motion's outcome.
Changing only the final balance handoff did not fix that trajectory.

The alternative uses the existing inverted-to-back transfer from a front
start: fold both hips toward −2.5 rad over 1.4 seconds, detect a quiet
back-facing pose, return the hips toward ride over two seconds, then use the
existing back get-up with its sensor-triggered handoff to learned balance.
Wheel torque requests are zero during the transfer. It adds neither a motor
nor a new mechanical motion range, and there is no retry of a failed get-up.

## Bounded preflights

- `evidence/unified-roof-preflight-01/`: two earlier tilted-roof failures,
  each at 0.25 and 0.125 ms. **4/4 pass**.
- `evidence/front-slow-transfer-preflight-01/`: nominal near-floor front
  start and three standing releases (forward, leftward, rightward), each at
  both timesteps. **8/8 pass**, including the previously failed lateral
  releases. All six release trials show body-ground impact before recovery.

Every trial runs 24 seconds without a native mechanism/electrical rejection.
These preflights use known development/regression cases, not fresh starts.
They justify selecting the slower front transfer for the next fixed bank;
they do not establish general recovery reliability.

The complete native recordings, controller/source identities and failed-run
references are retained. Audits reconstruct every controller decision from
its recorded sensor input, verify seeded initial conditions and state/current
continuity, check sampled kinematics, and recompute final standing gates.
Contacts and continuous physical guards still rely on the hashed native
runner; this is not an independent dynamics rerun or hardware qualification.

## Fixed evaluation scope

The selected controller is frozen before one 128-trial evaluation:

- 22 trials covering both timesteps for all 11 prior failed starting poses.
- 90 fresh trials: seeds 87000–87004 for each of nine fall directions, both
  timesteps.
- 16 standing releases: eight directions at both timesteps, with the same
  prescribed 4 rad/s initial rotation and consistent root linear velocity.

The cohorts remain separate. Prior failures are regression cases; the release
bank is a finite disturbance screen, not randomized impact coverage. Every
trial keeps the original continuous final two-second standing criterion,
motor limits and uncorrected native trajectory. The trial list and runtime
are recorded in `plan.json` before execution.

## Completed results

The remote evaluation completed all **128 full 24-second trials**. The local
recording audit passes for all 128 records, including the retained failures.
Every trial passes the native mechanism and electrical guards.

| Cohort | Successful rollouts | Starting poses passing both timesteps |
| --- | --- | --- |
| Earlier failed starts (regression) | 19/22 | 8/11 |
| Fresh near-floor starts, nine directions | 83/90 | **38/45** |
| Prescribed falls from standing, eight directions | 15/16 | **7/8** |

The earlier fresh evaluation used different seeds and passed 35/45 paired
starts. The new 38/45 result is a separate test bank, not a matched estimate
of the change in success rate. The regression cohort directly revisits the
earlier failed starts. All 16 standing-release records contain body-ground
contact before recovery; these prescribed releases do not cover arbitrary
pushes, drops or landing conditions.

All **11 failures** time out while returning the hips from the folded pose
to prepare the back get-up. No trial fails at initial orientation selection.
The failures are:

| Cohort | Direction and seed | Physics timestep |
| --- | --- | --- |
| Regression | front-left 84000, front-left 85003, front-right 85000 | 0.25 ms |
| Fresh | front 87003; left 87000, 87002, 87003 | 0.125 ms |
| Fresh | right 87000; inverted 87002, 87004 | 0.25 ms |
| Standing release | front-left 86000 | 0.25 ms |

Each failed pose passes at the other timestep. That sensitivity remains a
limitation; none of these pairs is counted as a successful recovery. The
controller is frozen after this capped evaluation, with no automatic retry
or further timing sweep.

Evidence: [evaluation summary](evidence/unified-recovery-evaluation-01/summary.json),
[recording audit](evidence/unified-recovery-evaluation-01/recording-audit.json),
and the complete compact native NPZ recordings beside them. The audit verifies
the recordings and controller decisions; it does not turn 117 successful
rollouts into 128 successful recoveries.

## Static check of the return motion

`return_support_energy.py` evaluates gravitational energy at 61 symmetric hip
positions and 581 sagittal body angles using the unchanged native collision
geometry and mass properties. It tracks the nearest local energy minimum as
the hips unfold, starting from the folded back rest.

A local minimum exists at every sampled hip position, but its supporting
surface and orientation change. Near hip angle −2.111 rad, the first energy
barrier toward further backward tipping is only **0.019 J**: the sampled rest
is at −90° and the adjacent local maximum is at −98°. Later, near +0.078 rad,
the tracked minimum changes by 28° between adjacent hip samples. The full grid
and all local minima are retained in
[the static diagnostic](checks/return-support-energy/summary.json).

This suggests examining angular momentum and support changes during the
return before changing the body or adding motors. It does not establish the
cause of the dynamic failures. The calculation omits friction, motor dynamics,
lateral stability and contact-force equilibrium, and is not a new recovery
simulation or proof of mechanical feasibility.

## Local viewer

The existing front recovery entry now shows a **leftward fall from standing**,
settling, the slow transfer onto the back, the back get-up and learned balance.
Its label is **Programmed fall recovery · slow transfer**. The selected local
preflight passes at both timesteps; the displayed record is the full 24 seconds
at 0.25 ms. It is an illustrative successful trial, not a montage of the bank.

The exporter verifies the current plant, CAD identities, body transforms,
recording/audit identities and all 2,400 recorded COM/linkage samples. A separate
exterior check finds no cross-body surface intersections across 481 sampled
poses using 12 concave printed shells and both actual CAD tires. It does not
check internal hardware, containment, minimum clearance, continuous swept
clearance or printed strength. Exterior, Cutaway and Physics remain available;
the programmed jump remains the default motion. Nothing is pushed or deployed.

Browser QA on the local Tailscale URL confirms the new dropdown label and
cohort totals, the fallen exterior pose at 2.4 s, folded Cutaway at 4.8 s,
and learned balance with both wheels grounded in Physics view at 24 s. No
browser console errors were recorded. The delivered tab plays in Exterior.

## Remaining work

Recovery is still partial and programmed, with a learned balance endpoint.
The remaining return failures need a controller or mechanism change justified
by their trajectories, followed by new tests. A finite nominal bank does not
qualify all falls, uneven terrain, uncertain sensors or hardware parameters.
Other learned skills can proceed on the unchanged 120 mm plant while this
specific return limitation stays open; the failed PPO and timing recipes remain
closed rather than being restarted unchanged.

## Subsequent return-braking experiment

The [fixed gyro-based wheel-braking study](RETURN_BRAKE.md) adds feedback only
during the symmetric hip return. Its 54-trial bank passes all ten previous
near-floor failed starts and all eight prescribed standing releases at both
timesteps, covering all eleven failures above. Nine fresh starting poses also
pass both timesteps. The complete original evaluation and its failures remain
unchanged; the newer small fresh bank is not a rerun of the previous 45-pose
cohort. Hardware and learned balance weights are unchanged.
