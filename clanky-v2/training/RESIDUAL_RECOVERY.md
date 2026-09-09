# Bounded feedback learning for the back get-up

This experiment retains the 120 mm wheels, four motors, current native plant,
programmed back get-up sequence and `balance-clone-02` endpoint. PPO learns
corrections during the initial 1.34-second sequence. It does not replace the
whole maneuver with an end-to-end recovery actor.

## Interface

The policy runs at 100 Hz. Its four bounded outputs add at most **0.35 rad**
to each hip target and **0.2 Nm** to each wheel's torque request. The combined
command is clipped through the original native interface; motor current,
voltage, hip range, spring travel, linkage branch and other plant guards are
unchanged. Corrections are disabled after the sequence, when the existing
learned balance actor takes over.

The actor retains 25 inputs and the critic 37. This adapter has a distinct
observation contract: accelerometer slots 6–8 are zero; command slot 3 (actor
index 22) contains normalized sequence phase from −1 to +1; command slot 4
(index 23) indicates whether corrections are active. Previous-action inputs
describe the actual applied combined command. The actor receives gyro,
projected gravity and encoder signals, not COM or contact labels. Phase is an
internal controller clock, not privileged simulator state. The frozen balance
actor receives its original observation interface.

These weights must be deployed with `residual_recovery.py` and the hashed
`recovery-reference/` bundle. Loading them into the old 50 Hz worker or treating
their output as an absolute motor command would implement a different policy.

## Checks and bounded trial

`checks/residual.json` compares zero correction against the original nominal
get-up at both physics timesteps for all 800 samples. Both retain the same
continuous standing durations. Recomputed float32 inference differs slightly;
maximum root-state error is 2.6e−8 and maximum generalized-coordinate error is
1.44e−6. `checks/residual-vector.json` checks 24 scalar/subprocess transitions
at mixed timesteps with identical observations, and confirms worker shutdown.

The five-update, 64-environment smoke completes 7,680 transitions in 18 seconds
on the remote CPU. This is only 1.2 simulated seconds per environment, so no
recovery episode finishes during that training smoke. In four full-length
nominal evaluations, zero correction passes 2/2 and the smoke actor passes
1/2. All four complete eight seconds without a plant rejection. NumPy export
agrees with the actual normalized PyTorch actor within 7.5e−9 over 192 inputs.
The smoke actor is not promoted to the viewer.

A separate **100-update pilot** uses fresh weights and seeds 78200–78263,
with half the environments at 0.25 ms and half at 0.125 ms. Initial states are
perturbed back-fallen poses; there is no parameter randomization or other fall
family in this pilot. PPO uses 128/128/64 networks, learning rate 1e−4,
gamma 0.9975, lambda 0.98 and initial normalized correction standard deviation
0.1. Small correction-magnitude and change penalties supplement the existing
native reward. The physical success gate remains unchanged.

The pilot is capped at 100 updates without automatic extensions. Its final
evaluation compares zero correction and the learned correction on the same
nominal start and ten fresh perturbed starts (79000–79009), each at both
timesteps: 44 full eight-second rollouts. Report paired success across both
timesteps as well as aggregate passes. A worse policy must not replace the
existing programmed viewer demonstration.

## Result: recipe closed without adoption

The pilot completes 100 updates and 153,600 transitions in 396 seconds on the
remote CPU. During training, 166 episodes meet the standing gate and 58 time
out. This training success count does not qualify its deterministic actor.

On the **same fresh evaluation starts**, the final learned correction is worse:

| Controller | All rollouts, including nominal | Fresh starts passing both timesteps |
| --- | --- | --- |
| Existing sequence, zero correction | 21/22 | 9/10 |
| Final learned correction | 10/22 | 1/10 |

All 44 complete eight seconds without a plant rejection. The learned policy
also loses the nominal coarse-timestep get-up. Its NumPy export agrees with
the normalized PyTorch actor within 6.0e−8 over 192 inputs. Independent audits
of both smoke and pilot verify source/checkpoint/recording identities, policy
inference, sampled gyro/gravity/encoder observations, currents, linkage geometry
and final-window gates. These audits preserve the failed motion results.

The baseline's 9/10 here is a different finite start set from its earlier 5/10;
it must not be presented as a general 90% recovery capability. The residual
recipe is **finished and not extended or promoted**. Existing viewer recovery
demonstrations are retained. Evidence is under `evidence/residual-back-smoke-01`
and `evidence/residual-back-pilot-01`, including all 48 independent rollouts.

The parallel [front get-up experiment](FRONT_RECOVERY.md) adds a second
demonstration family, but remains sensitive to initial pose and timestep. Next,
test transitions based on observed state and physically settled fallen starts,
rather than repeating this PPO configuration. Broader fall coverage remains
required. Nothing here justifies changing the selected wheels or adding motors.
Reliable back recovery, impacts, self-contact dynamics, observation uncertainty,
thermal duty and real hardware remain unqualified.
