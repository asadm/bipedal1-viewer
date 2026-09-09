# Native training on the selected 120 mm V2

**Recovery return braking, 2026-09-09:** the fixed [gyro-feedback experiment](RETURN_BRAKE.md)
passes **54/54 native simulations**: all ten prior near-floor failed starts,
all eight prescribed standing-fall directions, and nine fresh near-floor
starts, each at both timesteps. All eleven previously failed starts now pass
both timesteps. This adds wheel braking during leg return; hardware and learned
balance weights stay unchanged. It remains programmed recovery on nominal flat
ground; arbitrary falls and sim2real remain unqualified.

**Terrain adaptation, 2026-09-09:** one [capped terrain fit](TERRAIN_DRIVING.md)
improves the learned actor from 2/13 to **5/13 courses passing at both timesteps**,
adding ±5° and +10° cross slopes. Stones and longitudinal grades remain unresolved.
A flat-driving stop case regresses, so this remains a separate experimental
actor. The [contact continuation diagnostic](TERRAIN_CONTACT.md) confirms that
allowing body contact does not make its 20/30 mm stone routes pass. The local viewer includes its recorded +10° cross-slope traversal.
Hardware stays at **120 mm wheels and four motors**; no deployment was pushed.

**Learned driving, 2026-09-09:** the unchanged 120 mm robot now has a
[command-conditioned driving actor](COMMAND_DRIVING.md), trained from demonstrations.
It passes all speed, turning and stop checks in 24/24 fresh rollouts; 20/24 pass
every gate, or **10/12 starting sequences at both physics timesteps**. Four runs
exceed the strict 8° roll bound during their initial tilted-start transient.
This is nominal flat-floor driving; terrain and hardware uncertainty remain
unqualified. The actor is separate from the balance and recovery options below.

**Previous recovery result, 2026-09-09:** the unchanged **120 mm, four-motor** plant
has a [learned balance actor](GUIDED_BALANCE.md) and a
[combined programmed recovery controller](UNIFIED_RECOVERY.md). The latter passes
**38/45 fresh starting poses at both timesteps** (83/90 rollouts) and **7/8
prescribed standing-fall directions at both timesteps** (15/16 rollouts).
A regression bank passes 8/11 earlier failed poses at both timesteps. All 11
remaining failed rollouts time out during leg return. No new recovery weights
were trained in this study. The local viewer includes a complete fall and
successful get-up, labeled programmed with learned balance. Full fall recovery,
terrain robustness and sim2real remain unfinished; the records below describe
the preceding experiments.

This is a new training adapter for the **2.489247 kg, four-motor, 120 mm**
robot in the current V2 viewer. It does not load the older `src/clanky` model
or its learned checkpoints. Hardware geometry, springs, masses, gearing,
current limits and voltage are unchanged.

The first **64-environment, five-update PPO smoke passed as a pipeline test**.
It collected 7,680 transitions in 23 seconds on the remote CPU. Its policy
passed **0/22** fixed standing/fall evaluations at 0.25 and 0.125 ms. All 22
rollouts completed eight seconds without a mechanism/electrical rejection.
That smoke established no successful learned balance or recovery skill.

A separate **100-update pilot is finished**, using fresh weights, seeds
62000–62063 and the same configuration. It collected 153,600 transitions in
467 seconds; all 384 completed episodes timed out. Its final policy also
passes **0/22** fixed evaluations. All 22 complete eight seconds with valid
plant guards. This unchanged recipe is closed, with no automatic repeat or
extension. The remote directory is
`/home/asad/benirobot-v2-train/runs/recovery-pilot-01.tar.gz` (verified lossless
archive; the local evidence directory remains unpacked).

The subsequent [guided balance experiment](GUIDED_BALANCE.md) is complete.
Behavior cloning and one DAgger correction produce a separate learned actor
that passes **16/16 fresh starting poses at both timesteps**, plus the old
failed-pose regression at both timesteps: **34/34 eight-second rollouts**.
The actor runs alone at **100 Hz**, using gyro, gravity and encoder inputs.
This establishes nominal flat-floor balance from standing and tilted starts;
reliable full get-up, terrain and hardware uncertainty remain unqualified.
The subsequent [back get-up experiment](RECOVERY_SHOOTING.md) passes its
nominal start at both timesteps using an optimized programmed sequence and
this learned balance endpoint. Only 5/10 fresh perturbed back starts pass at
both timesteps. The local viewer includes both clearly labeled replays. The
subsequent [residual PPO trial](RESIDUAL_RECOVERY.md) is closed after its
100-update pilot: the learned correction passes only 1/10 fresh starts at both
timesteps, versus 9/10 for zero correction on the same new set. It is not
promoted. The [front get-up experiment](FRONT_RECOVERY.md) passes 7/10 fresh
starts at both timesteps, but its unperturbed start fails at the finer timestep.
The [settled-start and sensor-handoff experiment](SETTLED_RECOVERY.md) now
improves back recovery from 6/10 to **10/10 fresh starts passing both timesteps**
on matched tests. Front remains 7/10. Both nominal settled demonstrations pass
both timesteps and replace the existing front/back viewer entries. Four
inverted transfers fail; a static check finds wheel support at deep folding,
and a subsequent [inverted-specific transfer](INVERTED_RECOVERY.md) now passes
its nominal start at both timesteps and 9/10 fresh starts at both timesteps
(19/20 rollouts). It folds onto the back, returns the legs slowly, then reuses
the back get-up. It remains programmed, with a learned balance endpoint.
The subsequent [orientation-routed recovery study](ORIENTATION_RECOVERY.md)
adds a programmed side transfer and passes **35/45 fresh starts at both
timesteps** across nine directions (73/90 rollouts). Fourteen failures stop
at an unrecognized initial tilted-roof pose; front get-up and leg return
also retain failures. A separate standing-release impact screen passes
**4/8 directions at both timesteps**. No hardware or learned weights change;
reliable all-direction recovery and sim2real remain unfinished. The local
viewer includes the new side get-up with these limits.
The older PPO adapter below stays at 50 Hz.
The original 50 Hz PPO pilot does not establish that the four-motor mechanism
cannot recover. Across its deterministic evaluation recordings, requested hip targets span
approximately −0.393 to 1.03 radians on the left and −0.099 to 1.03 on the
right. It does not explore the available deep folding range down to −2.75.
This is another reason to investigate guided motion instead of treating these
policy failures as a mechanical feasibility test.

## What is simulated

`export_native_training.py` freezes the original native XML and runtime helper
sources into `plant/`. The XML is checked byte-for-byte against the current
recovery model. Every worker checks the bundle hashes and MuJoCo version.
Each environment has its own model because guide friction is mutable.

Native MuJoCo 3.3.7 runs RK4 at 4 kHz, the original electrical/current/guide
update runs every physics step, hip PD and wheel torque requests run at
500 Hz, and PPO acts at 50 Hz. Hip limits remain −2.8 to 1.08 radians.
The actor requests hip targets between −2.75 and 1.03 radians and wheel
torques up to ±0.5 Nm; the original motor envelope determines delivered
torque. Ceilings remain 32 A for hips, 8 A for wheels, at 11.1 V.

The actor has 25 inputs: ideal IMU angular velocity, projected gravity and
acceleration; hip positions and velocities; wheel velocities; previous
actions; and six command values. Projected gravity currently uses ideal
orientation, so an actual IMU estimator still needs validation. The critic
adds body velocity, height, COM lean, roll and contact information (37 total).
Privileged COM/contact values are excluded from actor inputs.

PPO uses `rsl_rl` 5.0.1 and CPU PyTorch 2.9.1, MLP layers 128/128/64 and
normalized observations. Initial action means request the ride pose, with
Gaussian standard deviation 0.1. Four outputs command independent hip targets
and wheel torques. No standing controller, applied body support or replayed
state is injected into training.

The reset mixture is 35% standing, 25% tilted near-standing and 40% evenly
drawn from nine fall families. Starts are closed-linkage geometric poses,
slightly above compiled support, with small orientation/velocity perturbations
and zero motor/guide history. They are **not** the three held-rest snapshots,
nor falls generated by impacts. Episodes last up to eight seconds. Training
ends an episode after two continuous seconds of stable standing; evaluation
continues for eight seconds and requires the final two seconds to pass.

Loop closure alone misses a four-bar assembly-branch flip. Training therefore
checks the selected branch and hip limits at every physics step, alongside
closure, gear equality, spring travel, motor envelope, finite state, simulator
warnings and absence of applied body forces. Invalid states terminate with a
penalty. This guard does not turn the simulated compliant joint stop into a
qualified physical stop.

## Checks and retained evidence

- `checks/local.json`: 201 analytic linkage poses, 55 perturbed resets,
  independent friction state, actor/critic separation, fault injection and
  1,600-step comparison against the original native drive. It rejects all
  eight archived wrong-branch trajectories.
- `checks/remote.json` and `checks/cross-host.json`: identical code and action
  sequence on macOS arm64 and Linux x86_64. Maximum generalized-position
  difference is 3.0e−12; float32 actor input difference is 7.5e−9.
- `checks/vector.json`: 320 scalar/parallel transitions agree, including 19
  automatic resets; timeout handling and worker shutdown pass.
- `evidence/recovery-smoke-01/`: original checkpoint, source snapshots,
  manifest, log and all 22 evaluation recordings. The NumPy actor agrees
  with the actual normalized PyTorch actor within 6.0e−8 over 192 inputs.
- `evidence/recovery-pilot-01/`: complete capped pilot and 22 final recordings.
  The same inference check differs by at most 1.2e−7. The two evidence audits
  verify source/checkpoint hashes, recorded current ceilings, sampled closure,
  linkage branch and COM, and recompute the sampled final-window gates.
- `evidence/balance-clone-02/`: completed guided actor and all 34 independent
  evaluations; see [method, control-rate checks and limits](GUIDED_BALANCE.md).
- `checks/remote-archive-journal.json`: the two completed failed recovery runs
  were losslessly compressed remotely, with every file hash checked before
  removing the uncompressed copies. Both remain unpacked in local evidence.

The recovery evaluator checks final-window wheel/body contact, COM lean and
roll, linear/angular speed, ride hip pose, continuous standing and all plant
guards. Only the initial state is reset. Recordings contain actual simulated
positions, velocities, actions, COM and currents.

The smoke and pilot use the same fixed evaluation set for comparison. It is
held out from training seeds but is not an untouched final certification set.
New seeds, disturbances and hardware uncertainty are required for qualification.

## Reproduction

Local export and checks use `.venv-sim`. On the remote host, the isolated
environment is `/home/asad/benirobot-v2-train/.venv`; the original training
project remains separate. `requirements-remote.lock.txt` records installed
packages. Install the pinned `torch==2.9.1+cpu` and
`torchvision==0.24.1+cpu` from PyTorch's CPU index before the remaining lock
file; an unconstrained torchvision dependency can select a much larger GPU
PyTorch distribution.

```sh
.venv-sim/bin/python design/clanky-v2/export_native_training.py
.venv-sim/bin/python design/clanky-v2/training/check_adapter.py \
  --output design/clanky-v2/training/checks/local.json \
  --history design/clanky-v2/native/recovery

# On the remote host, from /home/asad/benirobot-v2-train:
.venv/bin/python training/check_adapter.py --output training/checks/remote.json
.venv/bin/python training/check_vector.py --output training/checks/vector.json
.venv/bin/python training/train.py --output runs/new-smoke \
  --iterations 5 --num-envs 64 --workers 16 --seed 61000
.venv/bin/python training/evaluate.py --run runs/new-smoke \
  --output runs/new-smoke/evaluation --workers 12
```

The GPU driver on the remote host is unavailable, so this path uses native
CPU MuJoCo. No GPU/backend equivalence is claimed. Self-contact, deformable
TPU tires, terrain training, sensor noise/delay, parameter randomization,
thermal duty, battery sag and physical stop/structure tests remain outside
this recovery experiment. NumPy inference agreement is not an ONNX or
sim-to-real qualification. Failed PPO actors are not presented as successful
viewer skills. The later guided-balance replay is local only; nothing is pushed.
