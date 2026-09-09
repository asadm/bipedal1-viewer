# Upside-down recovery through the back get-up

The unchanged **120 mm, four-motor V2** now has a nominal upside-down get-up
that passes at both 0.25 and 0.125 ms. On ten fresh perturbed starts, **19/20
rollouts pass and 9/10 starts pass both timesteps**. The failed case is seed
83000 at 0.25 ms; it returns upside down while the legs unfold. Every failure
remains in the evidence. This is a programmed supervisor followed by the
existing learned balance actor, not a newly trained recovery policy or reliable
all-fall recovery.

## Mechanism and controller

The robot first settles upside down for three seconds while the motors hold
the ride hip targets. No body state, velocity, motor current, guide history or
simulator clock is reset between the subsequent phases:

1. Fold both hips toward −2.5 rad over 1.4 seconds. The body tips onto its back.
2. Detect a quiet back-facing pose using gyro, projected gravity and hip
   encoders. The condition must hold for 0.2 seconds.
3. Return the hips to the ride target over two seconds. Detect another quiet
   back-facing pose with the hips near ride for 0.2 seconds.
4. Run the existing back get-up, including its sensor-triggered early handoff
   to the frozen `balance-clone-02` actor.

The first two transfers request zero wheel torque. They use the observed body
motion under leg actuation, rather than assuming the wheels touch the floor.
The supervisor only reads IMU and hip-encoder observations; simulator contact
flags are used for diagnostics and success checks. Each phase has a timeout,
and there is no automatic retry within these trials. A timed-out transfer
holds the commanded leg pose and remains recorded as a recovery failure.

The nominal slow-return program enters leg return 1.61 seconds after recovery
starts, back get-up at 3.80 seconds, and learned balance at about 4.9 seconds.
Each trial runs the full **3 seconds of settling plus 12 seconds of recovery**.
The final two seconds must satisfy the original continuous standing gate:
both tires grounded, no body contact, small lean/roll, low body speed and hips
near ride. Current, voltage, joint range, spring travel, linkage branch and
constraint guards remain those of the frozen native plant.

## Bounded experiments and retained failures

The preceding static sweep showed that tires could support a geometrically
inverted body at deep folding. That did not describe the dynamic path. An
eight-case screen tested two fold durations and both wheel directions at both
timesteps. **All eight failed and never established sampled tire contact**:
the moving body tipped onto its back before the assumed wheel contact. That
approach is closed without further wheel-torque tuning.

The observed tip onto the back motivated the new transfer. A four-case screen
compared 1.2-second and two-second leg return durations at both timesteps:

| Leg return | 0.25 ms | 0.125 ms |
| --- | --- | --- |
| 1.2 seconds | Fails: returns upside down | Passes |
| 2.0 seconds | Passes | Passes |

The two-second duration was selected before evaluating seeds 83000–83009.
All 20 fresh tests settle successfully and complete 15 seconds without a native
plant rejection. Nineteen recover; the remaining case times out before the
back get-up. This finite bank retains the ride initial hip pose, ideal sensors,
flat rigid ground and nominal hardware parameters. It does not qualify impact
falls, different leg poses, TPU compliance, estimator errors or sim2real.

## Geometry, recording audits and viewer

`checks/inverted-fold-exterior.json` tests 101 prescribed symmetric hip poses
from ride to −2.6 rad against 12 concave printed shells and both actual CAD
tires. It finds no cross-body surface intersections. The successful nominal
slow-return trajectory also passes a separate 301-sample screen along the
actual 15-second recording. Neither screen checks internal hardware, spring
pistons, containment/minimum clearance, continuous path clearance or strength;
self-contact dynamics are still absent from the simulator.

The recording audits verify source and policy identities, every controller
decision and transition against its saved pre-action observation, continuous
time and state/current preservation at the settling handoff, sampled sensor
reconstruction and linkage geometry, current ceilings and final-window posture
gates. Recorded contact flags and continuous physics guards rely on the hashed
runner; these audits do not rerun full dynamics or qualify hardware.

Evidence directories under `training/evidence/` are `inverted-contact-01`,
`inverted-to-back-screen-01` and `inverted-to-back-evaluation-01`. The local
viewer adds **Programmed upside-down get-up → learned balance**, using the
nominal two-second-return record that passes both timesteps. It shows the full
settling and recovery duration and the 9/10 paired fresh result. Existing
front/back get-ups, jump, manual controls, Cutaway and Physics are retained.
Nothing is pushed.

Next, choose recovery from the measured resting orientation, add side/diagonal
coverage, and test actual falls from standing. The remaining leg-return failure
also needs attention before calling inverted recovery reliable. The current
evidence supports continuing with the same four motors and body geometry.
