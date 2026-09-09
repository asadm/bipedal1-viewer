# Encoder-cap contact refinement and higher riding posture

This experiment keeps the current four-motor hardware and CAD. It changes
the encoder-cap collision approximation and tests a higher hip command. It
does not add printed parts, motors or mechanical joints.

The baseline terrain controller and its 21 earlier records remain unchanged.
`native_terrain_posture_trial.py` is a separate experiment so the baseline's
source hashes remain reproducible. It uses the same wheel balance, heading,
hip feedforward, roll correction, current/voltage limits and success criteria.
It starts in the original ride pose, then smoothly raises the commanded hip
angle from 0.25 to 1 second using motor torque. The driving command starts
accelerating at 1 second. No root or joint coordinates are prescribed after
initialization, and the original gear reference angles stay unchanged.

## Contact representation

The old encoder cap uses one convex hull. This bridges the conical shoulder
and the projecting screw ears and can collide where the displayed CAD has
clearance. The new builder clips the actual CAD surface triangles at four
axial bands and eight radial sectors, then makes a hull for each patch.
Every clipped triangle patch remains enclosed; small holes and concavities
inside a patch can still be filled. These are simulation contact shapes,
not additional manufactured parts.

The compiled plant has 78 collision geometries instead of 16. The body mass,
COM, inertia tensors, actuator count/gearing, joint reference coordinates,
armatures and heightfield samples are checked for exact equality with the
unrefined plant. All other collision geometry, including the shin case and
rigid 120 × 20 mm tires, remains unchanged.

`implementation-checks.json` retains 1,088 independent probe rays, of which
990 intersect the source triangle mesh. No mesh hits are missed by either
collision approximation. Median outward ray error decreases from 0.765 mm
to 0.00074 mm. The 95th percentile decreases from 6.88 to 2.49 mm and the
maximum from 9.00 to 4.54 mm. The remaining error makes this a conservative
approximation, not exact non-convex CAD contact.

At the saved 6.28-second state of the original blocked 30 mm trial, the false
encoder-cap contact disappears. The shin-case contact at 6.08 seconds is
preserved. Correcting the later cap contact therefore does not by itself
establish that the original ride posture traverses the course.

## Reproduction

From the repository root:

```text
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/check_native_terrain_clearance.py
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_terrain_posture_trial.py --ride .419 --name cap-only-419-250us
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_terrain_posture_trial.py --ride .7 --name raised-700-250us
```

Each trial retains its parameters, strict-JSON report, generalized-coordinate
recording and exact compiled terrain. Controller and plant source hashes are
checked again after the rollout. These remain programmed, perfect-state,
low-speed experiments on fixed rounded stones; no learned skill, physical
off-road performance or broad terrain/hardware robustness is implied.

## Outcome and next mechanical candidate

The nominal cap-only correction still stops at the lower shin/motor case.
Raising the hip command to 0.70 or 0.95 rad does not clear this 30 mm course.
Doubling heading proportional/damping gains to 0.6/0.14 also fails at both
raised postures. The body first contacts after about 5.04–6.09 seconds, after
touching four of the ten stones. These runs preserve the failed body-contact,
route, exposure and stopping checks; they are not successful terrain replays.

The 0.95-rad stone run repeats at 0.125 ms and still contacts the case:
5.386 / 5.384 seconds at the two timesteps. Contact-force peaks differ
substantially with timestep (523 / 1,318 N for the larger wheel-normal peak),
so these rigid-contact spikes are not converged structural design loads.

The 0.95-rad posture can raise, drive and settle on flat ground at both
timesteps. The runs end 2.885 / 2.886 m from their starts with final-window
peak speeds of 0.0580 / 0.0584 m/s.
This isolates the terrain clearance problem from the ability to command the
higher posture. The finite controller search does not prove that another
four-motor controller cannot traverse the stones.

Eight trials are retained: two passing flat cases and six blocked stone
cases. No case from this follow-up is promoted as a successful 30 mm mode.

`summary.json` binds every result to the saved parameters, report, recording,
terrain, source files and freshly rebuilt scene identity. Its contact audit
checks the first saved body-contact frame against actual CAD triangles. All
sampled failed cases reach the shin-case surface within contact/tessellation
tolerance; the removed encoder-cap bridge is no longer the sampled blocker.

`foot-orientation-screen.json` evaluates a **static layout proposal**: put
the offset wheel motor on the other side of the lower link. Reflection of
the lower/wheel aggregate COM is included when aligning the robot over its
axle. With the same 120 mm wheels, minimum sampled case clearance rises from
**16.7 to 32.0 mm at the normal ride pose**, and remains about 32 mm across
the six sampled crouch-to-extension poses. This changes placement, not motor
count or tire diameter.

The reflection is not adopted hardware or a validated dynamics model. A full
CAD change must check the knee's keyed interface, wire passages, motor/gear
phase and real part orientation, enclosure fit throughout folding, mass and
inertia, then repeat jump and terrain dynamics. A 32 mm static clearance is
only a hypothesis for crossing 30 mm stones under roll, lean and tire loads.

The subsequent [full CAD study](../../../upward-foot/README.md) rejects the
fully reversed placement: exact solids collide in both fold and crouch.
Diagonal motor positions clear some named poses but still contact the body
or thigh elsewhere in the existing joint range. The static clearance benefit
is therefore not an adopted mechanical improvement.

```text
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_terrain_posture_review.py
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_foot_orientation_screen.py
```
