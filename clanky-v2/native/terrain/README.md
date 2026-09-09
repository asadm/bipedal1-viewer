# Current V2 terrain development

This study uses the **current 2.489 kg, four-actuator V2 model with explicit
rotating gears and motor rotors**. The older R2 terrain policy and its training
results belong to a different robot model and are not inherited here.

The controller is programmed feedback with perfect robot state at 500 Hz.
It has no terrain map, lookahead or terrain-height input. Wheels use scheduled
balance feedback plus heading control; each hip retains gravity/spring
feedforward, position feedback and a body-roll correction. The existing
current, voltage and transmission-loss model operates at each physics step.
No prescribed root motion, external support or ideal velocity actuator is used.

## Courses and checks

All courses are 4.5 × 1 m heightfields on a 5 mm grid. They include a level
starting region and a level stopping region. The original ground plane is
removed, so both tires and exterior robot collision hulls contact the actual
terrain geometry.

- **Fixed rounded stones:** ten stones in two wheel-track lanes, with some
  left/right obstacles staggered. Heights are 10, 20 or 30 mm; lengths are
  approximately 100–160 mm and widths 70–100 mm. Seeded offsets and radii are
  stored in each report. These are fixed bumps, not loose or sharp-edged rocks.
- **Slopes:** a 0.9 m ascent, 0.1 m plateau and 0.9 m descent, at ±5 or ±10°.
  Negative signs reverse the order into a depression, testing the other
  transition direction. The maximum elevation is not a vertical step height.
- **Cross slopes:** ±5 or ±10° transverse grades, approached and left through
  gradual 0.25 m transitions.
- **Flat:** the same heightfield/contact path provides a driving regression.

The nominal command accelerates smoothly to 0.4 m/s, cruises, then decelerates
to rest at 9 s. The position reference integrates that command to 2.8 m. Each
trial lasts 14 s and must remain settled throughout the last two seconds.
This is a low-speed mobility screen, not the separate 20 km/h requirement.

A passing case must complete the commanded distance within 0.15 m, remain
within 0.20 m of the course centre, avoid body contact, respect the motor,
hip, spring, linkage and gear constraints, and settle on both wheels. For
uneven terrain, both wheels must have more than 20 ms of loaded contact at
nonzero elevations. Stone cases also require contact with at least three
distinct stones in each track lane. Steering around the whole stone course
does not satisfy the exposure check.

The stopping gate is below 0.1 m/s horizontal speed, 5° COM lean and body roll,
and 0.2 rad/s pitch rate throughout the final two seconds. A body strike ends
the recording one second later and remains a failed, incomplete trial.

## Geometry validation and replay identity

`implementation-checks.json` checks twelve courses using independent MuJoCo
vertical rays against the exact exported triangular heightfield elevations.
Static contact probes verify tire contact with the actual stone surface.
They include a 1 mm contact-probe penetration solely to avoid tangent-contact
ambiguity; this is not part of the driving initial state or rollout.

The terrain model preserves the original robot masses/inertias. Its saved
MJCF identity includes all float32 elevation samples at sufficient precision.
The MJCF text row convention is reversed relative to runtime heightfield data;
the builder handles this explicitly and verifies exact sample equality on
loading. This avoids the row reversal and rounding observed when roundtripping
runtime samples through the installed MuJoCo 3.3.7 `MjSpec.to_xml()` path.
The field and scene hashes, compiled surface and actual generalized-coordinate
recording are retained for later viewer replay.

## Reproduction

From the repository root, expose `src` to use the existing terrain sampling
helpers without installing the training dependencies:

```text
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/check_native_terrain.py
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_terrain_screen.py
```

Each case has `report.json`, `parameters.json`, `trajectory.json` and the exact
`surface.json`. Source hashes bind the current CAD, plant and control code.
`coarse-summary.json` collects the initial 0.25 ms development screen.

The first screen passes **9/12** cases: flat, 10/20 mm stones, ±5° slopes and
all four ±5/±10° cross slopes. Both 10° longitudinal courses remain upright
but fail to complete the route; the positive grade also misses settling.
This is a control result, not evidence that four actuators cannot climb 10°.

The 30 mm stone trial contacts the lower case and is stopped after the contact
grace period, with four of ten stones touched. It is not classified as a
successful traversal. `case-contact-audit.json` compares contact locations with
the actual displayed CAD triangle mesh: the first shin-case contact reaches
that mesh by about 0.027 mm. A later encoder-service-cap contact has over 1 mm
of actual mesh clearance and appears to come from the convex collision proxy.
The cap collision shape and the foot's real clearance need refinement before
attributing the blocked motion entirely to hardware or choosing a larger wheel.

`fine-summary.json` repeats the nine passing courses at 0.125 ms; **all nine
pass again**, including contact with all ten stones on both the 10 and 20 mm
courses. The 20 mm route ends at 2.776 / 2.775 m displacement, with final-window
peak speeds 0.0405 / 0.0417 m/s. These are two timesteps of one seeded course,
not independent terrain-seed or hardware-variation validation. Run the repeat with:

```text
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/native_terrain_screen.py --prefix fine --timestep .000125 --repeat-passing coarse-summary.json
```

The local V2 viewer adds **Programmed stones · 20 mm** and **Programmed stones ·
30 mm · blocked** to its existing motion dropdown. The first preserves the
successful traversal and the second preserves the blocked attempt; both use
recorded body transforms and the exact compiled terrain. Exterior, Cutaway,
Physics, manual legs and the existing default jump remain available.

```text
PYTHONPATH=src .venv-sim/bin/python design/clanky-v2/export_native_terrain_replay.py
```

The contact audit also measures static symmetric-pose case clearance. It rises
from about **16.7 mm in the current ride pose to 24.9 mm at full extension**.
Testing a higher rough-ground posture is a concrete next control option using
the existing leg travel. These are kinematic clearances, not proof that the
higher posture crosses a 30 mm stone. The encoder-cap collision proxy also
needs improvement before using the blocked replay to justify a hardware change.

The [clearance follow-up](clearance/README.md) corrects the encoder-cap proxy
and tests higher riding postures. The lower case still contacts 30 mm stones;
raising alone does not solve these trials. A static motor-placement proposal
in that study raises normal-pose case clearance from 16.7 to 32 mm with the
same wheel diameter and four motors. It requires a full CAD/interface sweep
and dynamic validation before adoption.

The [completed placement fit study](../../upward-foot/README.md) now shows
that the fully reversed motor collides with the body/thigh during folding
and crouching. That placement is rejected; its static clearance estimate
does not transfer to an accepted robot design.

This does not qualify off-road hardware or a learned policy. Tires are still
rigid cylinders rather than deformable one-piece TPU prints. Loose stones,
sharp steps, soil, wheel slip estimation, random starts, turning/reversing,
hardware variation, structural loads and physical tests remain separate work.
