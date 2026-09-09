# Guided balance on the 120 mm robot

This experiment learns balance from the existing programmed controller, then
runs the learned actor alone. It retains the current native CAD, four motors,
springs, 120 mm wheels, electrical limits and linkage guards. It is a foundation
for recovery training, not a demonstration of getting up from a fall.

## Findings

The final learned policy passes **16/16 fresh starting poses at both 0.25 and
0.125 ms**, plus the earlier failed-pose regression at both timesteps:
**34/34 eight-second rollouts**. All finish with over seven seconds of
continuous stable standing. Evaluation uses the learned actor alone at 100 Hz.
The bounded balance experiment is finished. The subsequent
[back get-up experiment](RECOVERY_SHOOTING.md) uses this actor as its endpoint;
reliable full fall recovery remains under development.

The first policy passed **15/16 new starting poses at both 0.25 and 0.125 ms**
(30/32 rollouts). The remaining tilted pose causes an overshoot and fall at both
timesteps. The programmed teacher passes that exact pose at both timesteps.
This identifies an imitation/generalization error for that tested start;
it does not establish the mechanism's full recovery envelope.

One DAgger correction collected states visited by the student on 32 further
training starts (all 32 completed successfully). Only the student commanded the
motors during those rollouts; the teacher supplied labels for supervised
learning. The combined dataset contains 51,200 samples. Original validation
episodes were kept byte-identical and separate. The final evaluation uses
fresh seeds 75000–75015 at both timesteps, plus seed 73015 as the explicitly
identified old failed-pose regression. No further correction loop is running.

## Control rate and coordinates

The copied continuous-time controller settles the tested nominal and perturbed
starts at 500 Hz and 100 Hz. At 50 Hz it oscillates without settling. The guided
actor therefore runs at **100 Hz**, while hip PD still runs at 500 Hz and the
original native motor/guide updates run at every physics step. `GuidedEnv`
keeps the episode duration at eight seconds (800 policy steps). The earlier
50 Hz recovery experiments remain archived with their exact original code.
Future PPO fine-tuning must explicitly use this 100 Hz adapter; loading the
learned weights into the historical 50 Hz worker would change the controller.

The first two new teacher-adapter checks are superseded because the adapter
rotated a local `mjOBJ_BODY` angular velocity using the regular body frame.
MuJoCo uses the principal-inertia frame for that API object type. The corrected
teacher queries world-frame velocity directly, like the original controller.
See [MuJoCo's spatial-frame implementation](https://github.com/google-deepmind/mujoco/blob/main/src/engine/engine_core_util.c).
The regression check verifies world/IMU agreement over 32 randomized states.

The historical native environment's `velocity` feature, and earlier recordings
named `velocity_body`, express velocity at the chassis COM in its inertia axes.
Their speed/settling norms and rewards are rotation-invariant; those gates are
not changed by this correction. The old RL actor did not consume these
privileged velocity components. New guidance recordings name them
`velocity_inertial` explicitly.

## Learning and evaluation

The teacher successfully completes 32 demonstrations, yielding 25,600 aligned
pre-action observations and target actions. Twenty-four whole episodes are
training data and eight are validation data. Transient rows receive more
sampling weight than quiet standing. A 128/128/64 MLP is fit with 2,000 bounded
supervised optimizer updates; this is behavior cloning, not a new PPO result.

The policy uses gyro, projected gravity, hip positions/velocities and wheel
velocities. Acceleration, previous actions and constant commands have zero
input weights; the exported actor retains the same 25-input contract. It never
receives teacher COM, world position, contact state or labels during evaluation.
The NumPy export is compared against the actual normalized PyTorch actor.

Every independent rollout starts from a new reset and then advances only via
the four bounded motor commands. Passing requires all eight seconds without a
plant rejection and continuous stable standing throughout the final two seconds:
both tires grounded, body clear, COM lean and roll within 5°, linear speed below
0.1 m/s, angular speed below 0.2 rad/s and hips within 0.08 rad of ride pose.
The teacher is not constructed in learned-policy evaluation.

Artifacts live under `evidence/balance-teacher-*`, `balance-demonstrations-*`
and `balance-clone-*`; `checks/guidance.json` verifies velocity frames and the
100 Hz/four-kHz/eight-second timing contract. Each run includes source hashes
and snapshots. The first two failed teacher checks are retained as adapter
diagnostics and must not be used as evidence against the hardware.

The final checkpoint and all 34 independent recordings are in
[`evidence/balance-clone-02/`](evidence/balance-clone-02/), with the result table
in [`evaluation/summary.json`](evidence/balance-clone-02/evaluation/summary.json).
The local V2 viewer offers **Learned balance · tilted start**, an actual native
rollout from fresh seed 75008. Its exported body transforms come directly from
recorded MuJoCo positions and velocities, with source and CAD identity checks.
The programmed jump remains the default. Nothing is pushed or deployed.

`checks/guided-evidence.json` independently audits all 34 recordings, dataset
and checkpoint hashes, unchanged validation episodes, recorded current ceilings,
sampled linkage closure/branch/COM and the sampled final two-second gates.
Continuous physics-step rejection and stability still rely on the hashed
environment/evaluator; the audit does not rerun all dynamics.

These are nominal flat-floor tests with ideal IMU orientation and encoder
signals. Parameter uncertainty, observation delay/noise, actuator identification,
terrain, full fallen poses, self-contact, TPU deformation and hardware tests
remain required. No self-righting success or physical qualification is claimed.
