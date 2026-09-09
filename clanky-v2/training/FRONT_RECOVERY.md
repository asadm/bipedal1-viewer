# Programmed front get-up experiment

A separate bounded search on the unchanged 120 mm V2 finds a front get-up
sequence followed by the existing learned balance actor. **Seven of ten fresh
perturbed front starts pass at both physics timesteps** (14/20 rollouts).
The unperturbed start passes at 0.25 ms but fails at 0.125 ms. Including that
start gives **15/22** full eight-second passes. This is an experimental
programmed maneuver, not reliable or learned front recovery.

The single cross-entropy search is capped at 192 three-second development
rollouts. It is finished. Its best candidate then receives a full eight-second
test, and an independent set of 22 evaluations with the same native plant,
motor limits, selected linkage branch, spring and final two-second balance
criteria used for the back get-up. All 22 complete without a plant rejection;
the seven failed attempts never reach stable standing. The failed perturbed
seeds are 77000, 77001 and 77009 at both timesteps, plus the finer-timestep
nominal start. Every failure remains in the retained evidence.

The four smooth hip targets are −0.629, −2.288, 0.927 and 0.636 radians over
1.242 seconds, with corresponding wheel requests of −0.166, 0.315, −0.183 and
−0.106 Nm per wheel. These are commands; actual motion and torque are subject
to native dynamics and motor limits. The frozen balance actor takes over at
the next 100 Hz control boundary. No body support or state correction is used
after the initial fallen-pose reset.

`evidence/recovery-shooting-front-01/` contains all candidates, source snapshots,
the remote nominal recording and all independent evaluations. The geometry
screen samples 12 printed shell surfaces and both actual tire meshes along the
nominal coarse recording at 161 times. It finds no cross-body surface
intersection; it does not check internal hardware, continuous clearance,
containment, self-contact dynamics, material compliance or strength.

The original viewer example used perturbed seed 77002, which passes both
timesteps. The later [settled-start study](SETTLED_RECOVERY.md) now supplies
the front entry with a nominal example that settles under motor control for
three seconds before recovery. That new nominal example passes both timesteps;
the fresh settled-start paired result remains 7/10. The evidence here preserves
the earlier immediate-start failures. Neither experiment establishes all-family,
impact-fall or hardware recovery. Nothing is pushed, and this search is closed.
