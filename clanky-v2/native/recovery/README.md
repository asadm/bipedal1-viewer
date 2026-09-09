# Current 120 mm V2 — recovery development

**Latest result, 2026-09-09:** the unchanged **120 mm, four-motor** plant
has a [learned balance actor](../../training/GUIDED_BALANCE.md) and a
[combined programmed recovery controller](../../training/UNIFIED_RECOVERY.md). The latter passes
**38/45 fresh starting poses at both timesteps** (83/90 rollouts) and **7/8
prescribed standing-fall directions at both timesteps** (15/16 rollouts).
A regression bank passes 8/11 earlier failed poses at both timesteps. All 11
remaining failed rollouts time out during leg return. No new recovery weights
were trained in this study. The local viewer includes a complete fall and
successful get-up, labeled programmed with learned balance. Full fall recovery,
terrain robustness and sim2real remain unfinished; the records below describe
the preceding experiments.

The user selected **120 mm wheels** on 2026-09-09 and asked to move to the next
task. This work starts fall recovery on the current 2.489 kg, four-motor native
V2 plant. The larger-wheel experiments are closed without adoption. No hardware
geometry, motor, reduction, spring, battery voltage or current ceiling changes
in this recovery study. Nothing is pushed to GitHub.

**A nominal back get-up now passes at both timesteps**, using an optimized
programmed sequence followed by learned balance. Only 5/10 fresh perturbed
back starts pass at both timesteps, so reliable and all-family recovery remain
unproven. See the [new bounded recovery experiment](../../training/RECOVERY_SHOOTING.md).
The later [front get-up experiment](../../training/FRONT_RECOVERY.md) adds a
programmed demonstration with 7/10 fresh starts passing both timesteps; its
unperturbed start fails at the finer timestep. A bounded
[residual PPO trial](../../training/RESIDUAL_RECOVERY.md) made back recovery
worse on matched tests and is closed without adoption.
The subsequent [settled-start study](../../training/SETTLED_RECOVERY.md)
improves back paired passes from 6/10 to 10/10 on matched fresh starts by
triggering balance from measured posture. Front stays at 7/10. The subsequent
[inverted-to-back transfer](../../training/INVERTED_RECOVERY.md) passes its
nominal start and 9/10 fresh starts at both timesteps. It remains programmed,
with a learned balance endpoint; reliable all-fall recovery is not established.
The earlier [native PPO adapter](../../training/README.md)
passed its pipeline smoke; its first policy failed all 22 fixed
standing/fall evaluations. Standing
balance works on the new harness. The bounded programmed recovery seed search
is finished at 18 failed front/back attempts; it is not being expanded into an
open-ended sweep loop. A finite failed controller search does not prove the
four-motor mechanism incapable of recovery.

## Evidence so far

| Check | Result and scope |
| --- | --- |
| CAD plane support | 45 prescribed fall orientations/leg pairs. Compiled support differs from all-part CAD support by at most 0.00827 mm. No materially omitted metal protrusion in this bank. |
| Standing balance | Pass at 0.25 and 0.125 ms physics steps with 500 Hz torque requests. Final two-second peak body speeds 0.00112 / 0.00075 m/s. |
| Zero requested torque after fall reset | Nine families. Eight encounter the compliant extension stop and fail the hip-range gate; inverted remains within it. These are diagnostic falls, not recovery attempts. |
| Active front/back recovery seeds | Six sweeps per family, then one bounded six-case direction/turnaround follow-up. All 18 fail stable standing; all pass the remaining mechanism/electrical/constraint checks. |
| Motor-held fallen reset candidates | Front, back and inverted settle while retaining their intended fall family. The six side/diagonal candidates move to another family or remain moving, so are excluded from the accepted reset subset. |
| Independent recording audit | 38 trial/report/parameter identities, two rebuilt timestep models, sampled forward kinematics, COM, quaternion normalization and current/voltage ceilings pass. This does not upgrade failed motion results. |

`support-audit.json` checks front, back, both sides, inverted and four diagonals.
The original diagnostic accidentally used an Euler order that made diagonal
starts yawed front/back poses. Its report remains as
`support-audit-before-diagonal-fix.json`; it is superseded. The corrected helper
independently asserts each orientation's body-frame gravity direction.

`active-front-screen.json`, `active-back-screen.json` and `turnaround-*.json`
retain every recovery seed. The back sweep briefly rotates the body toward
upright, but continues folding the legs instead of achieving a supported stand.
The initial front sweep rolls toward inversion. Earlier back reversals and
initial front extension also fail. No capture of the standing controller occurs.
These are observations of the tested programs, not a diagnosis that motor power
is sufficient for every possible recovery path.

## Simulation and acceptance

The model uses the existing native CAD masses, explicit passive rotating
transmission groups and four output torque actuators. The six passive groups
are not six motors. Physics uses RK4. Hip and wheel ceilings remain 32 A and
8 A at 11.1 V with the existing voltage, speed, lag and loss model.

There is one initial reset: closed-linkage joint positions, a named body
orientation, zero initial velocity and 3 mm clearance above the actual compiled
support surface. All subsequent motion comes from motor torques and dynamics.
This is a fallen-pose initialization, not a simulated impact fall. No root
force, pose replay, height correction or velocity reset is applied during a run.
"Passive" in the report means zero requested output torque through the same
motor model; it is not an electrical open-circuit test.

The get-up gate requires eight seconds completed, with the entire final two
seconds on both tires and no other ground contact, body speed below 0.1 m/s,
COM lean and roll below 5 degrees, angular speed below 0.2 rad/s, and both hips
within 0.08 rad of ride. Linkage, spring, gear, joint, electrical and warning
checks are additional requirements. Early body contact is expected in recovery.
Only standing is repeated at half timestep; the failed recovery seeds remain
coarse-step diagnostics.

The additional selected-branch audit catches an important simulation failure:
the eight zero-requested-torque falls that overrun the soft hip stop can switch
to the other four-bar assembly branch. Small loop-closure error alone does not
detect that. `recording-audit.json` explicitly quarantines those already-failed
trials; none is an accepted reset or a displayed recovery attempt. The active
recovery attempts, motor-held starts and standing controls remain on the intended
branch in the sampled checks. The future training adapter must terminate on
branch/limit violations, and actual mechanical stops, joint retention and
self-contact need review before claiming power-loss fall behavior.

`held-reset-bank.json` contains actual final positions, velocities, currents and
torques. **Its accepted states are fallen starts, not successful recoveries.**
The three-family subset is not an all-family randomized evaluation bank and is
not a complete integrator/guide-state checkpoint. Side and diagonal transient
starts remain relevant for training even when they do not settle in that family.
Their failed candidates are retained rather than relabeled as another family.

The exact executed reset-bank and turnaround wrappers are retained in
`source-snapshots/`; the current entrypoints only remove an unused import.
Their summaries identify the archived executed sources. All simulation source
hashes and raw trial outputs are unchanged.

Rigid tires, outer CAD hulls, missing self-contact, unmeasured rotor/material
priors, perfect-state programmed feedback and absent thermal/battery/estimator
models remain limitations. Plane-support agreement is not a self-contact,
impact-load or hardware-strength qualification.

## Local inspection

http://100.97.184.4:8765/viewer/v2.html?motion=recovery-back&v=recovery-120-1

The dropdown adds front and back **Programmed recovery · failed** recordings.
They show actual native body transforms, with no resimulation or display height
correction. The exporter checks CAD/source/model identity and exact equality of
the compiled collision geometry to the original viewer's geometry. Exterior,
Cutaway and Physics share the recording. A grounded body is labeled as such,
rather than called airborne when neither tire touches. The homepage still
defaults to the existing 264 mm programmed jump; no new jump claim is made here.

## Original learning plan and subsequent work

The native adapter and guided balance foundation described below are now
implemented. The new [trajectory-guided recovery study](../../training/RECOVERY_SHOOTING.md)
has nominal back get-up evidence and retains its robustness failures. The
subsequent residual PPO trial, front get-up search and settled-start handoff
comparison are finished. An inverted-to-back transfer now adds partial inverted
recovery evidence. The subsequent [orientation-routed side study](../../training/ORIENTATION_RECOVERY.md)
passes 35/45 fresh starts at both timesteps across nine directions and 4/8
directions in a separate standing-release impact screen. Initial tilted-roof
selection and get-up robustness remain incomplete. The remaining text records
the original plan for this harness.

The existing `src/clanky` PPO assets and checkpoints describe an earlier
linkage. They must not be resumed and presented as current V2 recovery.
The next step is a separate V2 training adapter with the actual current motor,
spring and joint model; validate CPU/training-engine agreement before a long run.
Include selected-four-bar-branch and early joint-limit checks before collecting
training data; do not let learning exploit the quarantined branch-switch behavior.
Use sensor-based actor observations, with full state only for reward/critic and
validation. Restore motor/guide state correctly on reset. Begin with standing
and near-standing starts, plus the accepted fallen and explicitly transient
side/diagonal starts. Do not depend on the failed sweep programs as teachers.
Run the bounded pipeline smoke test before extending training, then evaluate
all fall families with held-out starts. If progress fails, inspect contacts and
compare hardware changes rather than repeatedly extending the same campaign.

The original harness trials in this directory ran locally. Subsequent native
PPO and supervised balance experiments are documented under `training/`.
