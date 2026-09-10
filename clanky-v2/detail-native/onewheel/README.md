# One-wheel study: loaded equilibria, short holds still fail

Latest result: **four corrected native equilibria**, verified at both timesteps,
and **0/4 qualified six-second holds**. A current-aware controller extends
single-wheel contact to 2.02–3.84 s but every trial reaches a hip travel guard.
There is no demonstrated entry, exit, disturbed hold, learned policy or hardware
one-wheel skill. Earlier studies and their failures remain below.

`detail_onewheel.py` tests exactly **1,250** combinations: 25 positions over
the usable range for each hip, on each support wheel. Of these, **474** meet
the declared static geometry and effort gates. The lowest-tilt examples lean
about 26°. This is a prescribed-pose result, not a demonstrated balancing skill.

For an oblique rigid cylindrical tire, the ground contact is its lowest rim
point. The screen rotates the complete CAD so its whole-system centre of mass
is above that point, then checks the other tire and actual collision-mesh
heights. It projects gravity, spring forces and the vertical ground force
through a closed-chain kinematic tangent to solve four motor torques. No support
moment or static joint friction is credited. Current and copper losses use the
existing unmeasured DC-equivalent motor priors; they are not thermal approval.

The static gate requires less than 50° body tilt, more than 3 mm shell clearance,
more than 10 mm other-wheel clearance, and less than 80% of the assumed motor
current limits. It does not audit complete CAD self-contact or TPU rim behavior.
Some extreme examples fold the free leg above the body; that is not a recommended
entry motion or a physically verified assembly pose.

`detail_onewheel_hold.py` attempts three postures per side: low effort, low tilt
and closest to ordinary ride. It numerically linearizes the actual MuJoCo/Drive
transition and uses finite-horizon local quadratic feedback. The state includes
the four motor currents. No state edits, rotor resets or root forces occur after
initialization. Initial motor current is preloaded and the robot starts already
leaning over one wheel; entry is not tested.

**All six nominal holds fail**, stopping within 0.061–0.272 s. Contact changes
and small initial drift lead to enormous requested torques and current saturation,
followed by tipping or body contact. The applied torques remain limited. The
linear model's closed-loop eigenvalues are insufficient evidence of a working
nonlinear controller. No failed case earns the conditional disturbance or
paired-timestep confirmation runs.

The controller study is stopped, with all reports, linearizations and short
trajectories preserved. These results reject this local feedback implementation,
not one-wheel mobility on the hardware. Before another controller/training run,
resolve the loaded equilibrium/contact linearization, check finite-amplitude
prediction, and plan entry/exit. A nonlinear controller or policy can then use
verified poses as a curriculum, with current limits and contact-based scoring.
Do not repeat this gain setup or call a static pose a learned skill.

## Operating-point diagnosis

`operating-point-diagnostic.json` checks the six saved reference poses with
their stated zero-speed motor torques. It advances no robot trajectory.
All six references have nonzero native acceleration. The low-effort pair
has only **12.3 N** of tire normal load against **25.6 N** total weight;
its initial vertical root acceleration is about **-5.84 m/s²**. Other
references have normal loads closer to weight but still substantial angular
acceleration. The ideal projected static-force calculation therefore does
not establish a loaded equilibrium of the actual soft-contact plant.

There is also a zero-speed discontinuity in the existing motor/gearbox
approximation. Starting with the same steady current and torque request,
the first 250 µs motor update produces about **30% more output torque**
when a tiny velocity opposes the request. The jump persists at speed probes
of 1e-4, 1e-6 and 1e-8 rad/s. The output-efficiency branch switches between
motoring and regeneration while the current has finite lag. These probes
evaluate isolated motor algebra; they are not new hold trials.

Both findings undermine treating the previous numerical derivative at rest
as a reliable local plant model. Before another controller or training run,
solve a loaded native equilibrium, retain the complete drive/guide state,
and verify finite-amplitude state predictions. Handle actuator switching
explicitly; changing the plant merely to obtain a pass would not qualify
the real robot. No motor model, hardware, gains or earlier outcomes changed
as part of this diagnosis.

MuJoCo's [forward/inverse dynamics API](https://mujoco.readthedocs.io/en/stable/APIreference/APIfunctions.html#mj-inverse)
and [official LQR tutorial](https://github.com/google-deepmind/mujoco/blob/main/python/LQR.ipynb)
are useful implementation references; the specific reduced controller here is
our experiment, not a reproduction or a result claimed by those sources.

## Correcting the native operating points

`loaded-equilibrium/` retains one bounded inverse-dynamics solve for each of
the six old references. Four pass: low-tilt and ride postures on both sides.
The two low-effort solves lose supporting contact and remain rejected; they
are not adaptively restarted. The four output joint positions stay fixed.
The variables are height, two body tilt angles and passive joint deflections,
including the existing six passive gear rotors. No motor or model is added.

The valid solutions carry the full **25.5888 N** weight on one tire. Compared
with the old reference, body height changes by about -11 or +7 micrometres;
small passive-joint and tilt corrections supply the soft-constraint loads.
An independent reconstruction checks zero-acceleration inverse forces,
forward acceleration and guide loads at both 250 and 125 microseconds.
These deflections are numerical contact/equality regularization, not measured
TPU or printed-part compliance. This follows MuJoCo's
[inverse-dynamics formulation](https://mujoco.readthedocs.io/en/3.3.7/computation/index.html#inverse-dynamics-and-optimization).

Fixed 1 ms support-hip velocity probes (+/-1e-6 and +/-0.01 rad/s), plus
10 ms zero-velocity probes, reproduce from the saved complete dynamic state.
In these particular probes, resetting guide-load memory makes no measured
difference. It is retained as real model state, but is not established as
the cause of the old failures. The original current transition still makes
a zero-speed linear extrapolation unusable: predicted current changes can
exceed thousands of amperes while the actual motor remains bounded.

## Current-aware requests, with the original motor limits

`detail_onewheel_current_control.py` analytically chooses a torque request
that produces the desired next motor current if it is reachable through
the existing current lag, current cap and back-EMF voltage limits. Otherwise
it requests the nearest attainable value. The unchanged `native_plant.Motor`
still performs every current update and applies output torque; no current
state is overwritten during motion. The motoring/regeneration switch remains.

All **980** isolated motor cases agree with the predicted attainable torque.
The four valid poses repeat their short probes at both timesteps. Their
10 ms zero-command-change drift becomes negligible and finite support-hip
velocity predictions improve substantially. Current remains nonsmooth at
zero speed and is deliberately handled by the nonlinear current controller,
not included as a differentiable state in the new mechanical feedback matrix.
Contact/friction prediction error remains; this narrow probe does not validate
every state, input, contact transition or a complete controller.

This controller assumes the exact nominal electrical parameters and current,
with requests at each 250/125 microsecond native step. It is not a validated
FOC implementation or an identified model of the purchased motors.

## Four loaded-reference hold trials: stopped at hip travel

`loaded-hold/` uses the corrected references and current-aware requests.
The mechanical feedback matrix is recomputed with 16 states and the old fixed
quadratic weights; no gain sweep is performed. The study retains the original
six-second duration and last-two-second standing criteria, with the native
spring/hip guards and a stricter 0.1 mm closure limit.

| Support / pose | Trial duration | Longest one-wheel contact | First failing gate |
|---|---:|---:|---|
| Left / low tilt | 2.35450 s | 2.28700 s | Hip travel |
| Left / ride | 2.48675 s | 2.44675 s | Hip travel |
| Right / low tilt | 3.84050 s | 3.84050 s | Hip travel |
| Right / ride | 2.01800 s | 2.01800 s | Hip travel |

Every trial is a failure. There is no six-second completion, no qualifying
stable finish and no conditional timestep/disturbance confirmation. The
right-support trials hit hip travel without any motor-limited steps. No
body contact, other-wheel contact, voltage/current envelope violation,
closure or spring-travel guard triggers before the hip margin [-2.79, 1.07].
That identifies the stopping boundary, not a need for more motor power or
permission to extend the joint limits.

`recording-check.json` feeds the recorded motor requests through the original
native `Drive` and independently reconstructs the feedback requests, contact
scores, currents and failure boundary. All **42,799 frames** agree exactly
in pose, velocity, current, guide load and contact forces. This validates the
recorded failures, not one-wheel skill success.

`prediction-diagnostic.json` uses only these saved recordings. Before
saturation and large posture departures, the reduced matrix can predict
deceleration of a hip while the native plant accelerates it. In one right-ride
interval, actual hip velocity increases by 0.00155 rad/s but the prediction
error is 0.00413 rad/s. All four stored closed-loop matrix radii are below one;
the nonlinear trials nevertheless depart from the reference. Stable matrix
eigenvalues therefore remain insufficient evidence.

This controller pattern is stopped. Before another one-wheel rollout, check
the full passive-joint position/velocity dynamics against the reduced model,
including finite body/hip position perturbations and several-step predictions.
The data do not yet isolate omitted compliant modes from friction/nonlinear
effects, or prove the hardware incapable. Do not repeat the gain setup, widen
hip travel, smooth the physical motor or promote an unchanged static pose as
a balancing skill. A future successful hold still needs a separately verified
two-wheel lean/unloading entry and controlled wheel-down exit.

Two implementation interruptions are preserved. The first hold preflight
incorrectly required the world-frame loaded connect-site residual to stay
zero during a rigid rotation; its small nonzero deflection vector must rotate
with the body. The corrected mapping changes only initialization/linearization;
no skill trial had started. The first recording audit was interrupted because
it repeatedly decompressed NPZ arrays; caching those arrays fixed verification
performance. The four physical trials were not rerun.

## Full mechanical-state prediction: no new controller trial

`full-state-model/` checks the next hypothesis with all 24 generalized position
coordinates, all 24 velocities and the two persistent guide loads. The same
nonlinear current-aware request layer still acts through the original motors.
Four references are checked at both timesteps, using two fixed derivative
stencils without selecting or tuning a replacement controller.

The extra states reduce the implausibly fast instability in the reduced
matrix, but **do not give reliable motion prediction**. On the old, small,
unsaturated recorded motions, one-millisecond hip-velocity RMS error improves
only about 13–14% in low-tilt poses and becomes about **3.5 times worse** in
ride poses. Five- and twenty-millisecond comparisons remain inconsistent.
Doubling the derivative stencil changes the state matrix by roughly 5–8%
in most cases. In the left low-tilt 125us case the change is about 46%, and a
derivative probe cannot achieve its requested torque through the existing
current lag (maximum 0.274 Nm shortfall). No limit is bypassed to make the
matrix appear smoother.

The fixed finite probes use height +/-1 micrometre, body roll/pitch +/-10
microradians, and either hip +/-0.1 milliradian along the loaded internal
tangent. Each runs for 20 ms at constant desired torque. The separate
`recording-check.json` reproduces all **80 probes / 9,680 states** exactly
through the original native `Drive`, including currents and applied torques,
and checks the stored finite-probe prediction errors. These are deliberately
small diagnostic initial perturbations, not a disturbance qualification.

No full-state feedback controller, new hold, learned policy, hardware change
or expanded joint range follows. One-wheel controller development is paused
while terrain driving proceeds. The remaining mismatch includes nonlinear
contact/friction and, in at least one probe, current-limit switching; these
tests do not isolate a single cause or establish physical impossibility.
