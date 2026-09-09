# Recovery selected from the resting orientation

Subsequent result: [consistent roof selection and slow front transfer](UNIFIED_RECOVERY.md)
revisits these failures and evaluates a new fresh bank. The results below remain
the historical record for the earlier controller.

The latest combined controller passes **35/45 fresh perturbed starts at both
timesteps** (73/90 rollouts) across nine fall directions. A separate standing-
release screen passes **4/8 directions at both timesteps** (8/16 rollouts).
These results add partial side and impact-generated recovery on the same
120 mm wheels and four motors. Full recovery is not achieved. All batches
below are finished; none is automatically extended or retried.

## Initial orientation-routing baseline

The unchanged **120 mm, four-motor V2** recovers from six of nine nominal
near-floor fall directions at both native timesteps: **12/18 rollouts**.
The controller is not given the initial fall-family label. It selects the
existing front, back or inverted maneuver using projected gravity, gyro and
hip encoders. Recovery remains programmed, with the frozen learned balance
actor as the endpoint; this does not train new recovery weights.

| Initial direction | Selected maneuver | Passes at 0.25 / 0.125 ms |
| --- | --- | --- |
| Front | Front get-up | Yes / yes |
| Back | Back get-up | Yes / yes |
| Left | Inverted-to-back transfer | Yes / yes |
| Right | Unsupported side rest | No / no |
| Inverted | Inverted-to-back transfer | Yes / yes |
| Front-left | Unsupported side rest | No / no |
| Front-right | Unsupported side rest | No / no |
| Back-left | Back get-up | Yes / yes |
| Back-right | Back get-up | Yes / yes |

All 18 complete their full 18 seconds without a native plant rejection.
The original continuous final two-second standing gate is unchanged. These
are nominal tests, not perturbed-start success rates or impact-fall tests.
The left start rolls upside down during settling; the back diagonals settle
onto the back. Right/front-left/front-right retain substantial lateral tilt,
so a front/back/inverted maneuver is not assigned to them by guesswork.

The existing motors hold the ride pose while the controller waits for at
least three seconds and 0.5 seconds of low gyro and hip speed. The hips must
also be near ride. Selection has a six-second deadline; an unsupported or
unsettled pose remains a recorded failure. No simulator state, velocity,
current, held motor state or clock is reset at selection. Each run makes a
single get-up attempt; it does not retry a failed get-up.

Evidence is `evidence/orientation-recovery-screen-01/`. The recording audit
checks identities, every controller selection/action/phase against recorded
sensor observations, state/current continuity, sampled geometry and the
final standing gates. Simulator contact flags and continuous guards rely on
the hashed runner; the audit does not rerun full dynamics. Ideal orientation
and encoders, rigid flat ground, nominal hardware parameters and the ride
initial hip pose remain limitations. Internal self-contact and mechanical
strength are not qualified.

## Asymmetric side transfer

The three unsupported side starts receive a separate finite comparison:
fold the leg nearer the floor or the upper leg, return to ride, and select
one get-up from the resulting measured orientation. The folded leg is chosen
from lateral gravity, not the initial fall-family name. One fold takes 1.4 s,
followed by 0.6 s of holding and 2 s returning both hips to ride. The wheel
requests remain zero during this transfer. There is one subsequent routing
attempt and no retry of a failed get-up.

| Initial direction | Lower leg folded | Upper leg folded |
| --- | --- | --- |
| Right | Fails both timesteps | Fails both timesteps |
| Front-left | Fails both timesteps | Passes both timesteps |
| Front-right | Passes both timesteps | Fails both timesteps |

The completed comparison has **4/12 successful 24-second trials**, all with
valid native guards. These alternative recipes do not constitute a single
controller that covers both directions. No perturbed-start evaluation is
justified for either unchanged recipe yet. Evidence is
`evidence/side-transfer-screen-01/`.

Eight unsuccessful transfers end on a tilted roof rest: projected gravity is
approximately `[0, ±0.645, 0.764]`, with both hips near ride and neither wheel
grounded. The original conservative classifier rejects this orientation,
so these cases never attempt an inverted get-up. This observation motivates
one six-case follow-up using the lower-leg recipe and admitting a quiet
tilted roof rest to the existing inverted controller. Its success gate,
get-up commands and hardware remain unchanged; changing the selection basin
is a hypothesis to test, not a reason to relabel the earlier failures.

That follow-up, `evidence/side-roof-transfer-screen-01/`, passes **6/6 local
rollouts**, all three directions at both timesteps. The lower-leg motion is
the same for every direction. After that transfer, quiet roof rests with
gravity z > 0.65, |y| < 0.75 and |x| < 0.15 can enter the unchanged inverted
get-up. This is a selection-rule change, not a new get-up or relaxed success
criterion. Native guards pass in all six trials.

## Frozen combined-controller evaluation

The follow-up is frozen before a single 108-trial evaluation: all nine nominal
starts and five fresh perturbations per direction (seeds 85000–85004), each
at both timesteps, for 24 seconds. The evaluation runs on the remote Linux
CPU with an isolated copy of the exact source and plant in `/dev/shm`; the
completed recordings are copied back and audited locally. `plan.json` records
the trial list, source identities and runtime before execution.

| Initial direction | Fresh successful rollouts | Fresh starts passing both timesteps |
| --- | --- | --- |
| Front | 9/10 | 4/5 |
| Back | 10/10 | 5/5 |
| Left | 0/10 | 0/5 |
| Right | 6/10 | 3/5 |
| Inverted | 10/10 | 5/5 |
| Front-left | 9/10 | 4/5 |
| Front-right | 9/10 | 4/5 |
| Back-left | 10/10 | 5/5 |
| Back-right | 10/10 | 5/5 |
| **Total** | **73/90** | **35/45** |

All 108 trajectories complete with valid native guards. The nominal subset
passes 17/18 rollouts, or 8/9 directions at both timesteps. The nominal
front-left 0.25 ms case fails during leg return on the remote host despite
passing locally. The six matched side records have the same source, native
plant and initial conditions; their numerical trajectories differ across
hosts. That sensitivity is retained in `cross-host-comparison.json`, not
resolved by picking the successful host's result.

Fourteen fresh failures stop **before attempting a get-up**. They settle
directly onto a tilted roof with gravity approximately `[0, ±0.645, 0.764]`.
The initial router rejects that pose, while the extended roof classifier is
only used *after* a side fold. All ten left trials and four right trials fail
this way. The other three fresh failures are front seed 85003 at 0.25 ms
and leg-return timeouts for front-left seed 85003 and front-right seed 85000,
also at 0.25 ms. This separates a missing initial selection case from actual
get-up failures; it does not establish mechanical impossibility.

Evidence is `evidence/orientation-recovery-evaluation-01/`. The full source,
pre-action observations, commands, native trajectories and failures remain
available. The next controller change should admit the tilted roof pose at
initial selection too, then use a fresh test bank. Front get-up and leg-return
robustness need separate work. These completed tests should not be rerun
unchanged or have their failures relabeled.

## Falls generated from standing

`evidence/standing-release-recovery-screen-01/` starts at the nominal standing
geometry with a prescribed 4 rad/s body angular velocity. The initial root
linear velocity corresponds to rotation about the wheel-ground support edge.
This represents a finite disturbance initial condition, not a calibrated
physical push. Every later state follows native dynamics; no mid-run impulse,
position correction, actuator reset or external supporting force is applied.

All 16 trials register body-ground contact before recovery, first occurring
0.18–0.53 seconds after release, and all complete 24 seconds with valid native
guards. Forward, backward and both backward diagonals recover at both
timesteps. Left, right and both forward diagonals fall into a front-facing
pose, select the front get-up, and fail it at both timesteps. The result is
**8/16 rollouts, 4/8 release directions**, not all-direction impact recovery.
The additional impact audit verifies the standing initialization, prescribed
velocity and sampled pre-recovery body contact. Impact forces and physical
strength are not qualified.

## Local replay and remaining limits

The viewer adds **Programmed side get-up → learned balance** using the local
nominal right-side recording that passes both timesteps. It shows all 24
seconds and states the combined controller's 35/45 fresh paired result.
Exterior, Cutaway and Physics use identical recorded body transforms; jump
remains the default. Nothing is pushed.

Two 481-frame geometry screens cover the earlier successful front-left upper-
leg transfer and the selected right-side lower-leg transfer. Neither finds
cross-body intersections between the 12 concave printed shells and two actual
CAD tires. These sampled exterior checks do not cover internal hardware,
minimum clearance, containment, continuous paths, self-contact dynamics or
strength. The same rigid ground, ideal sensors, nominal hardware parameters
and initially ride-positioned hips remain limitations. Broader impact
disturbances, uneven terrain recovery, newly learned get-up weights and
sim2real are still unfinished.
